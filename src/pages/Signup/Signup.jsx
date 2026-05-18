import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { Container, Row, Col, Card, Form, Button, ProgressBar, InputGroup } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import {
  IoBusinessOutline,
  IoCallOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoEyeOffOutline,
  IoEyeOutline,
  IoImageOutline,
  IoLocationOutline,
  IoLockClosedOutline,
  IoMailOutline,
} from 'react-icons/io5'
import { hideLoader, showAlert, showLoader } from '../../store/slices/uiSlice'
import { supabase } from '../../lib/supabaseClient'
import AuthTips from '../../components/AuthTips/AuthTips.jsx'
import './Signup.css'

const tips = [
  {
    title: 'Register Your Lab',
    text: 'Create a verified lab profile that users can trust.',
    bullets: ['Verified presence', 'Showcase capabilities', 'Build credibility'],
  },
  {
    title: 'Create Lab Services',
    text: 'Add tests and packages that users can book instantly.',
    bullets: ['Flexible test catalog', 'Package grouping', 'Clear pricing'],
  },
  {
    title: 'Receive Bookings',
    text: 'Get consistent bookings from users in your area.',
    bullets: ['Instant notifications', 'Smart scheduling', 'Frictionless flow'],
  },
  {
    title: 'Upload Results',
    text: 'Handle result uploads and keep patients informed.',
    bullets: ['Secure storage', 'Patient access', 'Audit trail'],
  },
  {
    title: 'Grow with LavenderCare',
    text: 'Increase visibility with a premium, mobile-first experience.',
    bullets: ['Brand elevation', 'Network reach', 'Mobile-first design'],
  },
]

const schema = Yup.object({
  name: Yup.string().required('Lab name is required'),
  contact_email: Yup.string().email('Invalid email').required('Contact email is required'),
  phone: Yup.string().required('Phone number is required'),
  country: Yup.string().required('Country is required'),
  state: Yup.string().required('State is required'),
  city: Yup.string().required('City is required'),
  address: Yup.string().required('Address is required'),
  profile_img: Yup.mixed().required('Profile image is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
})

const steps = [
  {
    key: 'lab',
    label: 'Lab',
    icon: IoBusinessOutline,
    fields: ['name', 'contact_email', 'phone'],
  },
  {
    key: 'address',
    label: 'Address',
    icon: IoLocationOutline,
    fields: ['country', 'state', 'city', 'address'],
  },
  {
    key: 'branding',
    label: 'Branding',
    icon: IoImageOutline,
    fields: ['profile_img'],
  },
  {
    key: 'credentials',
    label: 'Credentials',
    icon: IoLockClosedOutline,
    fields: ['email', 'password', 'confirmPassword'],
  },
]

function getStepProgress(stepIndex) {
  return ((stepIndex + 1) / steps.length) * 100
}

export default function Signup() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const fileInputRef = useRef(null)
  const stepperRef = useRef(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    if (stepperRef.current && stepperRef.current.children[stepIndex]) {
      stepperRef.current.children[stepIndex].scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }
  }, [stepIndex])

  const initialValues = useMemo(
    () => ({
      name: '',
      contact_email: '',
      phone: '',
      country: '',
      state: '',
      city: '',
      address: '',
      profile_img: null,
      email: '',
      password: '',
      confirmPassword: '',
    }),
    []
  )

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
                    <h2 className="lc-auth-heading">Create Lab Account</h2>
                    <p className="lc-auth-hint">
                      Register your lab, add services, receive bookings, and upload results.
                    </p>
                  </div>

                  <div className="lc-auth-progress">
                    <ProgressBar now={getStepProgress(stepIndex)} className="lc-auth-progressbar" />
                    <div className="lc-auth-stepper" ref={stepperRef}>
                      {steps.map((s, idx) => {
                        const Icon = s.icon
                        const isActive = idx === stepIndex
                        const isDone = idx < stepIndex
                        return (
                          <div
                            key={s.key}
                            className={[
                              'lc-auth-step',
                              isActive ? 'lc-auth-step--active' : '',
                              isDone ? 'lc-auth-step--done' : '',
                            ].join(' ')}
                          >
                            <div className="lc-auth-step-badge">
                              <Icon />
                            </div>
                            <div className="lc-auth-step-label">{s.label}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <Formik
                    initialValues={initialValues}
                    validationSchema={schema}
                    onSubmit={async (values) => {
                      dispatch(showLoader('Checking email...'))
                      try {
                        const { data: userExists, error } = await supabase.rpc('user_exists', {
                          email_input: values.email,
                        })

                        if (error) {
                          dispatch(
                            showAlert({
                              id: Date.now().toString(),
                              type: 'error',
                              message: 'Unable to verify email. Please try again.',
                              duration: 6000,
                            })
                          )
                          return
                        }

                        if (userExists) {
                          dispatch(
                            showAlert({
                              id: Date.now().toString(),
                              type: 'error',
                              message: 'A user with this email address already exists.',
                              duration: 7000,
                            })
                          )
                          return
                        }

                        navigate('/otp', { state: { email: values.email, signupData: values } })
                      } catch (_e) {
                        dispatch(
                          showAlert({
                            id: Date.now().toString(),
                            type: 'error',
                            message: 'Signup failed. Please try again.',
                            duration: 6000,
                          })
                        )
                      } finally {
                        dispatch(hideLoader())
                      }
                    }}
                  >
                    {({
                      values,
                      errors,
                      touched,
                      handleChange,
                      handleBlur,
                      setFieldValue,
                      setTouched,
                      validateForm,
                      handleSubmit,
                    }) => {
                      const currentStep = steps[stepIndex]

                      const goNext = async () => {
                        const allErrors = await validateForm()
                        const touchedUpdate = {}
                        let hasError = false

                        currentStep.fields.forEach((f) => {
                          touchedUpdate[f] = true
                          if (allErrors[f]) hasError = true
                        })

                        setTouched({ ...touched, ...touchedUpdate })
                        if (!hasError) setStepIndex((i) => Math.min(i + 1, steps.length - 1))
                      }

                      const goBack = () => setStepIndex((i) => Math.max(i - 1, 0))

                      const onSelectImage = (file) => {
                        if (previewUrl) URL.revokeObjectURL(previewUrl)
                        setFieldValue('profile_img', file || null)
                        setPreviewUrl(file ? URL.createObjectURL(file) : '')
                      }

                      return (
                        <Form onSubmit={handleSubmit} className="lc-auth-form-body">
                          {currentStep.key === 'lab' && (
                            <div className="lc-auth-step-panel">
                              <div className="lc-auth-panel-title">
                                <IoBusinessOutline />
                                <span>Lab Details</span>
                              </div>
                              <Row className="g-3">
                                <Col md={12}>
                                  <Form.Group>
                                    <Form.Label>Lab Name</Form.Label>
                                    <Form.Control
                                      name="name"
                                      value={values.name}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      isInvalid={touched.name && !!errors.name}
                                      placeholder="e.g., LavenderCare Diagnostics"
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>Contact Email</Form.Label>
                                    <InputGroup>
                                      <InputGroup.Text className="lc-auth-icon">
                                        <IoMailOutline />
                                      </InputGroup.Text>
                                      <Form.Control
                                        name="contact_email"
                                        value={values.contact_email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        isInvalid={touched.contact_email && !!errors.contact_email}
                                        placeholder="contact@yourlab.com"
                                      />
                                      <Form.Control.Feedback type="invalid">
                                        {errors.contact_email}
                                      </Form.Control.Feedback>
                                    </InputGroup>
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>Phone</Form.Label>
                                    <InputGroup>
                                      <InputGroup.Text className="lc-auth-icon">
                                        <IoCallOutline />
                                      </InputGroup.Text>
                                      <Form.Control
                                        name="phone"
                                        value={values.phone}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        isInvalid={touched.phone && !!errors.phone}
                                        placeholder="+1 234 567 890"
                                      />
                                      <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                                    </InputGroup>
                                  </Form.Group>
                                </Col>
                              </Row>
                            </div>
                          )}

                          {currentStep.key === 'address' && (
                            <div className="lc-auth-step-panel">
                              <div className="lc-auth-panel-title">
                                <IoLocationOutline />
                                <span>Lab Address</span>
                              </div>
                              <Row className="g-3">
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>Country</Form.Label>
                                    <Form.Control
                                      name="country"
                                      value={values.country}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      isInvalid={touched.country && !!errors.country}
                                      placeholder="Country"
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.country}</Form.Control.Feedback>
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>State</Form.Label>
                                    <Form.Control
                                      name="state"
                                      value={values.state}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      isInvalid={touched.state && !!errors.state}
                                      placeholder="State"
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.state}</Form.Control.Feedback>
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>City</Form.Label>
                                    <Form.Control
                                      name="city"
                                      value={values.city}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      isInvalid={touched.city && !!errors.city}
                                      placeholder="City"
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.city}</Form.Control.Feedback>
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control
                                      name="address"
                                      value={values.address}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      isInvalid={touched.address && !!errors.address}
                                      placeholder="Street address"
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
                                  </Form.Group>
                                </Col>
                              </Row>
                            </div>
                          )}

                          {currentStep.key === 'branding' && (
                            <div className="lc-auth-step-panel">
                              <div className="lc-auth-panel-title">
                                <IoImageOutline />
                                <span>Branding</span>
                              </div>
                              <Form.Group>
                                <Form.Label>Profile Image</Form.Label>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  className="d-none"
                                  onChange={(e) => onSelectImage(e.currentTarget.files?.[0] || null)}
                                />

                                {previewUrl ? (
                                  <div className="lc-auth-image-preview">
                                    <img src={previewUrl} alt="Lab profile preview" />
                                    <div className="lc-auth-image-actions">
                                      <Button
                                        type="button"
                                        variant="outline-secondary"
                                        onClick={() => fileInputRef.current?.click()}
                                      >
                                        Change Image
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="lc-auth-upload"
                                    onClick={() => fileInputRef.current?.click()}
                                  >
                                    <span className="lc-auth-upload-icon">
                                      <IoImageOutline />
                                    </span>
                                    <span className="lc-auth-upload-title">Upload a profile image</span>
                                    <span className="lc-auth-upload-subtitle">PNG or JPG, clear logo recommended</span>
                                  </button>
                                )}

                                {touched.profile_img && errors.profile_img && (
                                  <div className="lc-auth-inline-error">{errors.profile_img}</div>
                                )}
                              </Form.Group>
                            </div>
                          )}

                          {currentStep.key === 'credentials' && (
                            <div className="lc-auth-step-panel">
                              <div className="lc-auth-panel-title">
                                <IoLockClosedOutline />
                                <span>Account Credentials</span>
                              </div>
                              <Row className="g-3">
                                <Col md={12}>
                                  <Form.Group>
                                    <Form.Label>Email</Form.Label>
                                    <InputGroup>
                                      <InputGroup.Text className="lc-auth-icon">
                                        <IoMailOutline />
                                      </InputGroup.Text>
                                      <Form.Control
                                        name="email"
                                        value={values.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        isInvalid={touched.email && !!errors.email}
                                        placeholder="you@domain.com"
                                      />
                                      <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                                    </InputGroup>
                                  </Form.Group>
                                </Col>
                                <Col md={12}>
                                  <Form.Group>
                                    <Form.Label>Password</Form.Label>
                                    <InputGroup>
                                      <InputGroup.Text className="lc-auth-icon">
                                        <IoLockClosedOutline />
                                      </InputGroup.Text>
                                      <Form.Control
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={values.password}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        isInvalid={touched.password && !!errors.password}
                                        placeholder="Create a password"
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
                                      <Form.Control.Feedback type="invalid">
                                        {errors.password}
                                      </Form.Control.Feedback>
                                    </InputGroup>
                                  </Form.Group>
                                </Col>
                                <Col md={12}>
                                  <Form.Group>
                                    <Form.Label>Confirm Password</Form.Label>
                                    <InputGroup>
                                      <InputGroup.Text className="lc-auth-icon">
                                        <IoLockClosedOutline />
                                      </InputGroup.Text>
                                      <Form.Control
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={values.confirmPassword}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        isInvalid={touched.confirmPassword && !!errors.confirmPassword}
                                        placeholder="Confirm password"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline-secondary"
                                        className="lc-auth-eye"
                                        onClick={() => setShowConfirmPassword((s) => !s)}
                                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                      >
                                        {showConfirmPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                                      </Button>
                                      <Form.Control.Feedback type="invalid">
                                        {errors.confirmPassword}
                                      </Form.Control.Feedback>
                                    </InputGroup>
                                  </Form.Group>
                                </Col>
                              </Row>
                            </div>
                          )}

                          <div className="lc-auth-actions">
                            <Button
                              type="button"
                              variant="outline-secondary"
                              className="lc-auth-action"
                              onClick={goBack}
                              disabled={stepIndex === 0}
                            >
                              <IoChevronBackOutline />
                              Back
                            </Button>

                            {stepIndex < steps.length - 1 ? (
                              <Button type="button" className="lc-auth-action lc-auth-action--primary" onClick={goNext}>
                                Next
                                <IoChevronForwardOutline />
                              </Button>
                            ) : (
                              <Button type="submit" className="lc-auth-action lc-auth-action--primary">
                                Save & Continue
                                <IoChevronForwardOutline />
                              </Button>
                            )}
                          </div>
                        </Form>
                      )
                    }}
                  </Formik>
                  <div className="lc-otp__meta">
                    <span>Already have an account? </span>
                    <a href="#/login" className="lc-otp__link">Log in</a>
                  </div>
                </div>
              </Col>

              <Col lg={5} className="d-none d-lg-block">
                <div className="lc-auth-tips">
                  <AuthTips tips={tips} kicker="Why LavenderCare Labs?" />
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <div className="lc-auth-tips-mobile d-lg-none">
          <Card className="shadow-sm border-0">
            <Card.Body>
              <AuthTips tips={tips} kicker="Why LavenderCare Labs?" className="" />
            </Card.Body>
          </Card>
        </div>
      </Container>
    </div>
  )
}
