import { useState } from 'react'
import { Container, Row, Col, Card, Form, Button, InputGroup } from 'react-bootstrap'
import { IoLockClosedOutline, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { hideLoader, showAlert, showLoader } from '../../store/slices/uiSlice'
import { requestApi } from '../../lib/requestApi'
import AuthTips from '../../components/AuthTips/AuthTips.jsx'
import '../Signup/Signup.css'

const tips = [
  { title: 'Secure Reset', text: 'Choose a strong password.', bullets: ['At least 8 chars', 'Mix letters & numbers', 'Keep it private'] },
  { title: 'Stay Safe', text: 'Never share your password.', bullets: ['Avoid reuse', 'Change periodically', 'Use a password manager'] },
]

export default function ResetPassword() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [values, setValues] = useState({ password: '', confirmPassword: '' })
  const [touched, setTouched] = useState({ password: false, confirmPassword: false })

  const errors = {
    password: !values.password ? 'Password is required' : values.password.length < 8 ? 'Min 8 characters' : '',
    confirmPassword:
      !values.confirmPassword ? 'Confirm password is required' : values.confirmPassword !== values.password ? 'Passwords must match' : '',
  }

  const onChange = (e) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setTouched({ password: true, confirmPassword: true })
    if (errors.password || errors.confirmPassword || !email) return

    dispatch(showLoader('Resetting password...'))
    try {
      const res = await requestApi({
        url: 'https://tzsbbbxpdlupybfrgdbs.supabase.co/functions/v1/reset-password-from-forgot-password',
        method: 'POST',
        data: { email, new_password: values.password },
      })
      if (!res?.responseStatus) {
        throw new Error(res?.errorMsg?.message || res?.errorMsg?.error || 'Server error')
      }
      dispatch(
        showAlert({
          id: Date.now().toString(),
          type: 'success',
          message: 'Password reset successful. Please log in.',
          duration: 6000,
        })
      )
      navigate('/login', { replace: true })
    } catch (_e) {
      dispatch(
        showAlert({
          id: Date.now().toString(),
          type: 'error',
          message: 'Password reset failed. Please try again.',
          duration: 7000,
        })
      )
    } finally {
      dispatch(hideLoader())
    }
  }

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
                    <h2 className="lc-auth-heading">Reset Password</h2>
                    <p className="lc-auth-hint">Set a new password for {email}</p>
                  </div>

                  <div className="lc-auth-form-body">
                    <div className="lc-auth-step-panel">
                      <Form onSubmit={onSubmit}>
                        <Form.Group className="mb-3">
                          <Form.Label>New Password</Form.Label>
                          <InputGroup>
                            <InputGroup.Text className="lc-auth-icon">
                              <IoLockClosedOutline />
                            </InputGroup.Text>
                            <Form.Control
                              type={showPass ? 'text' : 'password'}
                              name="password"
                              value={values.password}
                              onChange={onChange}
                              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                              isInvalid={touched.password && !!errors.password}
                              placeholder="Enter new password"
                            />
                            <Button
                              type="button"
                              variant="outline-secondary"
                              className="lc-auth-eye"
                              onClick={() => setShowPass((s) => !s)}
                            >
                              {showPass ? <IoEyeOffOutline /> : <IoEyeOutline />}
                            </Button>
                            <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                          </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Confirm Password</Form.Label>
                          <InputGroup>
                            <InputGroup.Text className="lc-auth-icon">
                              <IoLockClosedOutline />
                            </InputGroup.Text>
                            <Form.Control
                              type={showConfirm ? 'text' : 'password'}
                              name="confirmPassword"
                              value={values.confirmPassword}
                              onChange={onChange}
                              onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                              isInvalid={touched.confirmPassword && !!errors.confirmPassword}
                              placeholder="Confirm new password"
                            />
                            <Button
                              type="button"
                              variant="outline-secondary"
                              className="lc-auth-eye"
                              onClick={() => setShowConfirm((s) => !s)}
                            >
                              {showConfirm ? <IoEyeOffOutline /> : <IoEyeOutline />}
                            </Button>
                            <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
                          </InputGroup>
                        </Form.Group>

                        <div className="lc-auth-actions">
                          <div />
                          <Button type="submit" className="lc-auth-action lc-auth-action--primary">
                            Reset Password
                          </Button>
                        </div>
                      </Form>
                    </div>
                  </div>
                </div>
              </Col>

              <Col lg={5} className="d-none d-lg-block">
                <div className="lc-auth-tips">
                  <AuthTips tips={tips} kicker="Password tips" />
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}
