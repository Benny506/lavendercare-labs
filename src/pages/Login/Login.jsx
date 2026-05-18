import { useState } from 'react'
import { Container, Row, Col, Card, Form, Button, InputGroup } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { IoMailOutline, IoLockClosedOutline, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5'
import { useDispatch } from 'react-redux'
import { hideLoader, showAlert, showLoader } from '../../store/slices/uiSlice'
import { authBootstrap } from '../../lib/authBootstrap'
import '../Signup/Signup.css'

export default function Login() {
  const dispatch = useDispatch()

  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [values, setValues] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({ email: false, password: false })

  const onChange = (e) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (!values.email || !values.password) return
    ;(async () => {
      dispatch(showLoader('Signing in...'))
      try {
        const res = await authBootstrap({ dispatch, email: values.email, password: values.password })
        if (!res.ok) {
          throw new Error(res.error || 'Login failed')
        }
        console.log("HERE")
        navigate('/dashboard', { replace: true })

      } catch (_e) {
        dispatch(
          showAlert({
            id: Date.now().toString(),
            type: 'error',
            message: _e?.message || 'Login failed. Please try again.',
            duration: 7000,
          })
        )
      } finally {
        dispatch(hideLoader())
      }
    })()
  }

  const errors = {
    email: !values.email ? 'Email is required' : '',
    password: !values.password ? 'Password is required' : '',
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
                    <h2 className="lc-auth-heading">Log In</h2>
                    <p className="lc-auth-hint">Enter your credentials to continue.</p>
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
                              value={values.email}
                              onChange={onChange}
                              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                              isInvalid={touched.email && !!errors.email}
                              placeholder="you@domain.com"
                            />
                            <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                          </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Password</Form.Label>
                          <InputGroup>
                            <InputGroup.Text className="lc-auth-icon">
                              <IoLockClosedOutline />
                            </InputGroup.Text>
                            <Form.Control
                              type={showPassword ? 'text' : 'password'}
                              name="password"
                              value={values.password}
                              onChange={onChange}
                              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                              isInvalid={touched.password && !!errors.password}
                              placeholder="Enter password"
                            />
                            <Button
                              type="button"
                              variant="outline-secondary"
                              className="lc-auth-eye"
                              onClick={() => setShowPassword((s) => !s)}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                            </Button>
                            <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                          </InputGroup>
                        </Form.Group>

                        <div className="lc-auth-actions">
                          <div />
                          <Button type="submit" className="lc-auth-action lc-auth-action--primary">
                            Log In
                          </Button>
                        </div>

                        <div className="lc-otp__meta">
                          <Link to="/forgot-password" className="lc-otp__link">
                            Forgot password?
                          </Link>
                        </div>
                        <div className="lc-otp__meta">
                          <span>Don’t have an account? </span>
                          <Link to="/" className="lc-otp__link">
                            Create account
                          </Link>
                        </div>
                      </Form>
                    </div>
                  </div>
                </div>
              </Col>

              <Col lg={5} className="d-none d-lg-block">
                <div className="lc-auth-tips">
                  <div className="lc-auth-tips-inner">
                    <div className="lc-auth-tips-kicker">Welcome back</div>
                    <div className="lc-auth-tip">
                      <div className="lc-auth-tip-title">Stay productive</div>
                      <div className="lc-auth-tip-text">Access bookings, manage results, and grow your lab.</div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}
