import { useState } from 'react'
import { Container, Row, Col, Card, Form, Button, InputGroup } from 'react-bootstrap'
import { IoMailOutline } from 'react-icons/io5'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { hideLoader, showAlert, showLoader } from '../../store/slices/uiSlice'
import { supabase } from '../../lib/supabaseClient'
import AuthTips from '../../components/AuthTips/AuthTips.jsx'
import '../Signup/Signup.css'

const tips = [
  { title: 'Reset Access', text: 'Recover your account securely.', bullets: ['Email verification', 'Secure reset', 'Clean flow'] },
  { title: 'Stay Protected', text: 'We verify ownership before changes.', bullets: ['Prevent misuse', 'Verify identity', 'Protect data'] },
]

export default function ForgotPassword() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)

  const error = !email ? 'Email is required' : ''

  const onSubmit = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (error) return

    dispatch(showLoader('Checking account...'))
    try {
      const { data: exists, error: rpcError } = await supabase.rpc('user_exists', { email_input: email })
      if (rpcError) {
        throw rpcError
      }
      if (!exists) {
        dispatch(
          showAlert({
            id: Date.now().toString(),
            type: 'error',
            message: 'No account found with this email.',
            duration: 6000,
          })
        )
        return
      }
      navigate('/otp', { state: { email, fromForgotPassword: true } })
    } catch (_e) {
      dispatch(
        showAlert({
          id: Date.now().toString(),
          type: 'error',
          message: 'Unable to process request. Please try again.',
          duration: 6000,
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
                    <h2 className="lc-auth-heading">Forgot Password</h2>
                    <p className="lc-auth-hint">Enter your email to receive a verification code.</p>
                  </div>

                  <div className="lc-auth-form-body">
                    <div className="lc-auth-step-panel">
                      <Form onSubmit={onSubmit}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <InputGroup>
                            <InputGroup.Text className="lc-auth-icon">
                              <IoMailOutline />
                            </InputGroup.Text>
                            <Form.Control
                              name="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onBlur={() => setTouched(true)}
                              isInvalid={touched && !!error}
                              placeholder="you@domain.com"
                            />
                            <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
                          </InputGroup>
                        </Form.Group>

                        <div className="lc-auth-actions">
                          <div />
                          <Button type="submit" className="lc-auth-action lc-auth-action--primary">
                            Continue
                          </Button>
                        </div>
                      </Form>
                    </div>
                  </div>
                </div>
              </Col>

              <Col lg={5} className="d-none d-lg-block">
                <div className="lc-auth-tips">
                  <AuthTips tips={tips} kicker="Account recovery" />
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}
