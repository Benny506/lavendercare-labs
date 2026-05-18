import { useEffect, useMemo, useRef, useState } from 'react'
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap'
import AuthTips from '../../components/AuthTips/AuthTips.jsx'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { hideLoader, showAlert, showLoader } from '../../store/slices/uiSlice'
import { createOrUpdateOtp, validateOtp } from '../../lib/supabaseClient'
import { sendEmail } from '../../lib/email'
import { requestApi } from '../../lib/requestApi'
import { supabase } from '../../lib/supabaseClient'
import '../Signup/Signup.css'

const OTP_LENGTH = 6

const tips = [
  {
    title: 'Secure Verification',
    text: 'OTP helps protect your lab account setup.',
    bullets: ['Reduces fraud', 'Protects access', 'Fast verification'],
  },
  {
    title: 'Next: Lab Services',
    text: 'After verification, you’ll add your lab services.',
    bullets: ['Create tests', 'Set pricing', 'Start receiving bookings'],
  },
  {
    title: 'Result Uploads',
    text: 'Upload and manage patient results with ease.',
    bullets: ['Organized workflow', 'Secure storage', 'Better patient experience'],
  },
  {
    title: 'Mobile First',
    text: 'Everything works smoothly on mobile and desktop.',
    bullets: ['Responsive UI', 'Clean layout', 'Premium feel'],
  },
  {
    title: 'LavenderCare Network',
    text: 'Grow visibility by joining the LavenderCare platform.',
    bullets: ['More reach', 'Better discoverability', 'Trusted brand'],
  },
]

export default function Otp() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || location.state?.signupData?.email || ''
  const [digits, setDigits] = useState(() => Array.from({ length: OTP_LENGTH }, () => ''))
  const inputRefs = useRef([])
  const [tipIndex, setTipIndex] = useState(0)

  const otp = useMemo(() => digits.join(''), [digits])
  const isComplete = useMemo(() => digits.every((d) => d && d.length === 1), [digits])

  const sendOtp = async () => {
    if (!email) {
      dispatch(
        showAlert({
          id: Date.now().toString(),
          type: 'error',
          message: 'Missing signup email. Please restart signup.',
          duration: 7000,
        })
      )
      navigate('/', { replace: true })
      return
    }

    dispatch(showLoader('Sending OTP...'))
    try {
      const { token, userAlreadyExists, error } = await createOrUpdateOtp({
        email,
        requiresAuth: location.state?.fromForgotPassword ? true : false
      })

      if (error) {
        dispatch(
          showAlert({
            id: Date.now().toString(),
            type: 'error',
            message: error || 'Failed to generate OTP. Please try again.',
            duration: 7000,
          })
        )
        return
      }

      if (userAlreadyExists && !location.state?.fromForgotPassword) {
        dispatch(
          showAlert({
            id: Date.now().toString(),
            type: 'error',
            message: 'A user with this email address already exists.',
            duration: 7000,
          })
        )
        navigate('/', { replace: true })
        return
      }

      const { sent, errorMsg } = await sendEmail({
        subject: 'Email verification',
        to_email: email,
        data: {
          code: token.otp,
        },
        template_id: '3vz9dle7wpn4kj50',
      })

      if (!sent) {
        dispatch(
          showAlert({
            id: Date.now().toString(),
            type: 'error',
            message: errorMsg?.message || errorMsg?.error || errorMsg || 'Failed to send OTP email.',
            duration: 7000,
          })
        )
        return
      }

      dispatch(
        showAlert({
          id: Date.now().toString(),
          type: 'success',
          message: 'OTP sent. Check your email.',
          duration: 5000,
        })
      )
    } catch (_e) {
      dispatch(
        showAlert({
          id: Date.now().toString(),
          type: 'error',
          message: 'Unable to send OTP. Please try again.',
          duration: 7000,
        })
      )
    } finally {
      dispatch(hideLoader())
    }
  }

  const focusIndex = (idx) => {
    const el = inputRefs.current[idx]
    if (el) {
      el.focus()
      el.select()
    }
  }

  const setDigit = (idx, value) => {
    setDigits((prev) => {
      const next = [...prev]
      next[idx] = value
      return next
    })
  }

  const handleChange = (idx, e) => {
    const raw = e.target.value
    const onlyDigits = raw.replace(/\D/g, '')
    if (!onlyDigits) {
      setDigit(idx, '')
      return
    }

    const last = onlyDigits.slice(-1)
    setDigit(idx, last)

    if (idx < OTP_LENGTH - 1) {
      focusIndex(idx + 1)
    }
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        e.preventDefault()
        setDigit(idx, '')
        return
      }
      if (idx > 0) {
        e.preventDefault()
        focusIndex(idx - 1)
      }
      return
    }

    if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault()
      focusIndex(idx - 1)
      return
    }

    if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) {
      e.preventDefault()
      focusIndex(idx + 1)
      return
    }
  }

  const handlePaste = (idx, e) => {
    const text = e.clipboardData.getData('text')
    const chars = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('')
    if (!chars.length) return
    e.preventDefault()

    setDigits((prev) => {
      const next = [...prev]
      let cursor = idx
      for (const c of chars) {
        if (cursor >= OTP_LENGTH) break
        next[cursor] = c
        cursor += 1
      }
      return next
    })

    const nextFocus = Math.min(idx + chars.length, OTP_LENGTH - 1)
    focusIndex(nextFocus)
  }

  useEffect(() => {
    focusIndex(0)
    void sendOtp()
  }, [])

  return (
    <div className="lc-auth-shell w-100">
      <Container className="lc-auth-container">
        <Card className="lc-auth-card shadow-lg border-0">
          <Card.Body className="p-0">
            <Row className="g-0">
              <Col lg={7}>
                <div className="lc-auth-form">
                  <div className="lc-auth-header lc-auth-header--center">
                    <div className="lc-auth-brand lc-auth-brand--center">
                      <img src="/logo.png" alt="LavenderCare" className="lc-auth-logo" />
                      <div>
                        <div className="lc-auth-title">LavenderCare</div>
                        <div className="lc-auth-subtitle">Labs</div>
                      </div>
                    </div>
                    <h2 className="lc-auth-heading">Verify OTP</h2>
                    <p className="lc-auth-hint">Enter the 6-digit code sent to your email.</p>
                  </div>

                  <div className="lc-auth-form-body">
                    <div className="lc-auth-step-panel">
                      <div className="lc-auth-panel-title">
                        <span>One-time password</span>
                      </div>

                      <Form
                        onSubmit={async (e) => {
                          e.preventDefault()
                          if (!isComplete) return
                          dispatch(showLoader('Verifying OTP...'))
                          try {
                            const isValid = await validateOtp({ email, otp })
                            if (!isValid) {
                              dispatch(
                                showAlert({
                                  id: Date.now().toString(),
                                  type: 'error',
                                  message: 'Invalid or expired OTP. Please try again.',
                                  duration: 7000,
                                })
                              )
                              return
                            }

                            if (location.state?.fromForgotPassword) {
                              dispatch(hideLoader())
                              navigate('/reset-password', { replace: false, state: { email } })
                              return
                            }

                            const signupData = location.state?.signupData
                            if (!signupData) {
                              dispatch(
                                showAlert({
                                  id: Date.now().toString(),
                                  type: 'error',
                                  message: 'Missing signup details. Please restart signup.',
                                  duration: 7000,
                                })
                              )
                              return
                            }

                            const file = signupData.profile_img
                            const ext = (file?.name && file.name.split('.').pop()?.toLowerCase()) || 'png'
                            const filePath = `labs/${signupData.email}-${Date.now()}.${ext}`

                            dispatch(showLoader('Creating your lab account...'))
                            const uploadRes = await supabase.storage
                              .from('user_profiles')
                              .upload(filePath, file, { upsert: true })
                            if (uploadRes?.error) {
                              throw new Error('Failed to upload profile image')
                            }

                            const addressParts = [
                              signupData.address,
                              signupData.city,
                              signupData.state,
                              signupData.country,
                            ].filter(Boolean)
                            const p_address = addressParts.join(', ')

                            const createRes = await requestApi({
                              url: 'https://tzsbbbxpdlupybfrgdbs.supabase.co/functions/v1/create-lab',
                              method: 'POST',
                              data: {
                                p_email: signupData.email,
                                p_password: signupData.password,
                                p_name: signupData.name,
                                p_phone: signupData.phone,
                                p_address,
                                p_profile_img: filePath,
                                p_contact_email: signupData.contact_email,
                              },
                            })
                            if (!createRes?.responseStatus) {
                              throw new Error(
                                createRes?.errorMsg?.message ||
                                  createRes?.errorMsg?.error ||
                                  'Server error'
                              )
                            }

                            dispatch(
                              showAlert({
                                id: Date.now().toString(),
                                type: 'success',
                                message: 'Account created. You can now log in.',
                                duration: 6000,
                              })
                            )
                            navigate('/login', { replace: true })
                          } catch (_e) {
                            dispatch(
                              showAlert({
                                id: Date.now().toString(),
                                type: 'error',
                                message: 'Account setup failed. Please try again.',
                                duration: 7000,
                              })
                            )
                          } finally {
                            dispatch(hideLoader())
                          }
                        }}
                      >
                        <Form.Group>
                          <Form.Label>OTP Code</Form.Label>
                          <div className="lc-otp">
                            {digits.map((val, idx) => (
                              <input
                                key={idx}
                                ref={(el) => {
                                  inputRefs.current[idx] = el
                                }}
                                value={val}
                                inputMode="numeric"
                                autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                                aria-label={`OTP digit ${idx + 1}`}
                                className="lc-otp__input"
                                onChange={(e) => handleChange(idx, e)}
                                onKeyDown={(e) => handleKeyDown(idx, e)}
                                onPaste={(e) => handlePaste(idx, e)}
                                maxLength={1}
                              />
                            ))}
                          </div>
                        </Form.Group>

                        <div className="lc-auth-actions">
                          <Button
                            type="button"
                            variant="outline-secondary"
                            className="lc-auth-action"
                            onClick={() => {
                              setDigits(Array.from({ length: OTP_LENGTH }, () => ''))
                              focusIndex(0)
                            }}
                          >
                            Clear
                          </Button>
                          <Button type="submit" className="lc-auth-action lc-auth-action--primary" disabled={!isComplete}>
                            Continue
                          </Button>
                        </div>

                        <div className="lc-otp__meta">
                          <button
                            type="button"
                            className="lc-otp__link"
                            onClick={() => {
                              void sendOtp()
                            }}
                          >
                            Didn’t receive a code? Resend
                          </button>
                        </div>
                      </Form>
                    </div>
                  </div>
                </div>
              </Col>

              <Col lg={5} className="d-none d-lg-block">
                <div className="lc-auth-tips">
                  <AuthTips tips={tips} kicker="Quick tips" />
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}
