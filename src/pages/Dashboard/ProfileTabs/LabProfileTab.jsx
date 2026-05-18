import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Col, Form, InputGroup, Row } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { IoImageOutline, IoMailOutline } from 'react-icons/io5'
import { supabase } from '../../../lib/supabaseClient'
import { getPublicImageUrl } from '../../../lib/requestApi'
import { setLabProfile } from '../../../store/slices/authSlice'
import { hideLoader, showAlert, showLoader } from '../../../store/slices/uiSlice'

function parseAddressParts(addressText) {
  const parts = (addressText || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)

  if (parts.length === 0) {
    return { address: '', city: '', state: '', country: '' }
  }

  const country = parts.length >= 1 ? parts[parts.length - 1] : ''
  const state = parts.length >= 2 ? parts[parts.length - 2] : ''
  const city = parts.length >= 3 ? parts[parts.length - 3] : ''
  const address = parts.length >= 4 ? parts.slice(0, -3).join(', ') : parts[0]

  return { address, city, state, country }
}

const schema = Yup.object({
  name: Yup.string().required('Required'),
  contact_email: Yup.string().email('Invalid email').required('Required'),
  phone: Yup.string().required('Required'),
  country: Yup.string().required('Required'),
  state: Yup.string().required('Required'),
  city: Yup.string().required('Required'),
  address: Yup.string().required('Required'),
})

export default function LabProfileTab() {
  const dispatch = useDispatch()
  const { labProfile, user } = useSelector((s) => s.auth)
  const fileInputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const profileImgUrl = useMemo(() => {
    if (previewUrl) return previewUrl
    const path = labProfile?.profile_img
    if (!path) return ''
    return getPublicImageUrl({ path, bucket_name: 'user_profiles' })
  }, [labProfile?.profile_img, previewUrl])

  const addressParts = useMemo(() => parseAddressParts(labProfile?.address), [labProfile?.address])

  if (!labProfile) return null

  return (
    <div className="lc-card">
      <Formik
        enableReinitialize
        initialValues={{
          name: labProfile?.name || '',
          contact_email: labProfile?.contact_email || '',
          phone: labProfile?.phone || '',
          country: addressParts.country,
          state: addressParts.state,
          city: addressParts.city,
          address: addressParts.address,
          profile_img_file: null,
        }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting }) => {
          if (!labProfile?.id || !user?.id) return
          dispatch(showLoader('Saving profile...'))
          try {
            let profile_img = labProfile.profile_img || null
            if (values.profile_img_file) {
              const file = values.profile_img_file
              const ext = (file?.name && file.name.split('.').pop()?.toLowerCase()) || 'png'
              const filePath = `labs/${user.id}/${Date.now()}.${ext}`
              const uploadRes = await supabase.storage.from('user_profiles').upload(filePath, file, { upsert: true })
              if (uploadRes?.error) {
                throw new Error('Failed to upload profile image')
              }
              profile_img = filePath
            }

            const addressParts = [values.address, values.city, values.state, values.country].filter(Boolean)
            const address = addressParts.join(', ')

            const { data, error } = await supabase
              .from('labs')
              .update({
                name: values.name,
                contact_email: values.contact_email,
                phone: values.phone,
                address,
                profile_img,
                updated_at: new Date().toISOString(),
              })
              .eq('id', labProfile.id)
              .select()
              .single()

            if (error) throw error

            dispatch(setLabProfile(data))
            dispatch(
              showAlert({
                id: Date.now().toString(),
                type: 'success',
                message: 'Lab profile updated.',
                duration: 4000,
              })
            )
          } catch (_e) {
            dispatch(
              showAlert({
                id: Date.now().toString(),
                type: 'error',
                message: 'Failed to update lab profile.',
                duration: 6000,
              })
            )
          } finally {
            dispatch(hideLoader())
            setSubmitting(false)
          }
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue }) => (
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={12}>
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: 72, height: 72, borderRadius: 16, overflow: 'hidden', background: '#f1f3f5' }}>
                    {profileImgUrl ? (
                      <img src={profileImgUrl} alt="Lab profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                        <IoImageOutline />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-bold">Profile image</div>
                    <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                      Upload a clear logo or lab photo.
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="d-none"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0] || null
                        setFieldValue('profile_img_file', file)
                        setPreviewUrl(file ? URL.createObjectURL(file) : '')
                      }}
                    />
                    <div className="mt-2 d-flex gap-2">
                      <Button type="button" variant="outline-primary" size="sm" onClick={() => fileInputRef.current?.click()}>
                        Change
                      </Button>
                      {previewUrl ? (
                        <Button
                          type="button"
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            setFieldValue('profile_img_file', null)
                            setPreviewUrl('')
                          }}
                        >
                          Reset
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Lab name</Form.Label>
                  <Form.Control
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.name && !!errors.name}
                  />
                  <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Contact email</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <IoMailOutline />
                    </InputGroup.Text>
                    <Form.Control
                      name="contact_email"
                      value={values.contact_email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.contact_email && !!errors.contact_email}
                    />
                    <Form.Control.Feedback type="invalid">{errors.contact_email}</Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    name="phone"
                    value={values.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.phone && !!errors.phone}
                  />
                  <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    name="country"
                    value={values.country}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.country && !!errors.country}
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
                  />
                  <Form.Control.Feedback type="invalid">{errors.city}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    name="address"
                    value={values.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.address && !!errors.address}
                  />
                  <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={12} className="d-flex justify-content-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save changes'}
                </Button>
              </Col>
            </Row>
          </Form>
        )}
      </Formik>
    </div>
  )
}
