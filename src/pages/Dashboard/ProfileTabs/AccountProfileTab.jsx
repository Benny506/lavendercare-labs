import { useState } from 'react'
import { Button, Col, Form, InputGroup, Row } from 'react-bootstrap'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { IoEyeOffOutline, IoEyeOutline, IoLockClosedOutline, IoMailOutline } from 'react-icons/io5'
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from '../../../lib/supabaseClient'
import { hideLoader, showAlert, showLoader } from '../../../store/slices/uiSlice'

const schema = Yup.object({
  password: Yup.string().min(8, 'Min 8 characters').required('Required'),
  confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Required'),
})

export default function AccountProfileTab() {
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className="lc-card">
      <Formik
        initialValues={{ password: '', confirmPassword: '' }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          dispatch(showLoader('Updating password...'))
          try {
            const { error } = await supabase.auth.updateUser({ password: values.password })
            if (error) throw error
            dispatch(
              showAlert({
                id: Date.now().toString(),
                type: 'success',
                message: 'Password updated successfully.',
                duration: 4000,
              })
            )
            resetForm()
          } catch (_e) {
            dispatch(
              showAlert({
                id: Date.now().toString(),
                type: 'error',
                message: 'Failed to update password.',
                duration: 6000,
              })
            )
          } finally {
            dispatch(hideLoader())
            setSubmitting(false)
          }
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <IoMailOutline />
                    </InputGroup.Text>
                    <Form.Control value={user?.email || ''} disabled />
                  </InputGroup>
                  <div className="text-muted mt-2" style={{ fontSize: '0.9rem' }}>
                    Email cannot be changed for now.
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>New password</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <IoLockClosedOutline />
                    </InputGroup.Text>
                    <Form.Control
                      type={showPass ? 'text' : 'password'}
                      name="password"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.password && !!errors.password}
                    />
                    <Button type="button" variant="outline-secondary" onClick={() => setShowPass((s) => !s)}>
                      {showPass ? <IoEyeOffOutline /> : <IoEyeOutline />}
                    </Button>
                    <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Confirm password</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <IoLockClosedOutline />
                    </InputGroup.Text>
                    <Form.Control
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={values.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.confirmPassword && !!errors.confirmPassword}
                    />
                    <Button type="button" variant="outline-secondary" onClick={() => setShowConfirm((s) => !s)}>
                      {showConfirm ? <IoEyeOffOutline /> : <IoEyeOutline />}
                    </Button>
                    <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={12} className="d-flex justify-content-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Update password'}
                </Button>
              </Col>
            </Row>
          </Form>
        )}
      </Formik>
    </div>
  )
}
