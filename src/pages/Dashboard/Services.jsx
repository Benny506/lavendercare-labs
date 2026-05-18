import { useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Form, InputGroup, Modal, Row, Table } from 'react-bootstrap'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { IoPencilOutline, IoAddOutline } from 'react-icons/io5'
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from '../../lib/supabaseClient'
import { addLabService, updateLabService } from '../../store/slices/authSlice'
import { hideLoader, showAlert, showLoader } from '../../store/slices/uiSlice'

export default function Services() {
  const dispatch = useDispatch()
  const { labProfile, labServices } = useSelector((s) => s.auth)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const formatDuration = (minutesRaw) => {
    const minutes = Number(minutesRaw)
    if (!Number.isFinite(minutes) || minutes <= 0) return ''
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m} min`
    if (m === 0) return `${h} hr${h === 1 ? '' : 's'}`
    return `${h} hr${h === 1 ? '' : 's'} ${m} min`
  }

  const sortedServices = useMemo(() => {
    const list = Array.isArray(labServices) ? labServices : []
    return [...list].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
  }, [labServices])

  const schema = Yup.object({
    name: Yup.string().required('Required'),
    description: Yup.string().nullable(),
    price: Yup.number().min(0, 'Must be 0 or more').required('Required'),
    duration_minutes: Yup.number().integer('Must be a whole number').min(1, 'Must be at least 1').required('Required'),
    result_tat_minutes: Yup.number().integer('Must be a whole number').min(1, 'Must be at least 1').required('Required'),
    is_active: Yup.boolean().required('Required'),
  })

  const openCreate = () => {
    setEditing(null)
    setShowModal(true)
  }

  const openEdit = (svc) => {
    setEditing(svc)
    setShowModal(true)
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 className="mb-1">Services</h4>
              <p className="text-muted mb-0">Create and manage lab services available for booking.</p>
            </div>
            <Button onClick={openCreate}>
              <IoAddOutline style={{ marginRight: 6 }} />
              Create Service
            </Button>
          </div>

          {sortedServices.length === 0 ? (
            <div className="lc-card text-center p-4">
              <p className="text-muted mb-3">No services created yet.</p>
              <Button variant="primary" onClick={openCreate}>
                Add your first service
              </Button>
            </div>
          ) : (
            <>
              <div className="d-none d-md-block">
                <div className="lc-card p-0">
                  <Table responsive className="mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: '34%' }}>Service</th>
                        <th style={{ width: '18%' }}>Price</th>
                        <th style={{ width: '18%' }}>Visit / TAT</th>
                        <th style={{ width: '15%' }}>Status</th>
                        <th style={{ width: '15%' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedServices.map((svc) => (
                        <tr key={svc.id}>
                          <td>
                            <div className="fw-bold">{svc.name}</div>
                            {svc.description ? (
                              <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                                {svc.description}
                              </div>
                            ) : null}
                          </td>
                          <td>₦{Number(svc.price).toFixed(2)}</td>
                          <td>
                            <div className="fw-bold">{svc.duration_minutes}m</div>
                            <div className="text-muted small">TAT: {formatDuration(svc.result_tat_minutes || 1440)}</div>
                          </td>
                          <td>
                            <Badge bg={svc.is_active ? 'success' : 'secondary'}>
                              {svc.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <Button variant="outline-primary" size="sm" onClick={() => openEdit(svc)}>
                              <IoPencilOutline style={{ marginRight: 6 }} />
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>

              <div className="d-md-none">
                <Row className="g-3">
                  {sortedServices.map((svc) => (
                    <Col xs={12} key={svc.id}>
                      <div className="lc-card">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-bold">{svc.name}</div>
                            <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                              ₦{Number(svc.price).toFixed(2)} · {svc.duration_minutes}m Visit · {svc.result_tat_minutes || 1440}m TAT
                            </div>
                          </div>
                          <Badge bg={svc.is_active ? 'success' : 'secondary'}>
                            {svc.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        {svc.description ? (
                          <div className="text-muted mt-2" style={{ fontSize: '0.95rem' }}>
                            {svc.description}
                          </div>
                        ) : null}
                        <div className="mt-3 d-flex justify-content-end">
                          <Button variant="outline-primary" size="sm" onClick={() => openEdit(svc)}>
                            <IoPencilOutline style={{ marginRight: 6 }} />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Edit Service' : 'Create Service'}</Modal.Title>
        </Modal.Header>
        <Formik
          enableReinitialize
          initialValues={{
            name: editing?.name || '',
            description: editing?.description || '',
            price: editing?.price ?? '',
            duration_minutes: editing?.duration_minutes ?? '',
            result_tat_minutes: editing?.result_tat_minutes ?? 1440,
            is_active: typeof editing?.is_active === 'boolean' ? editing.is_active : true,
          }}
          validationSchema={schema}
          onSubmit={async (values, { setSubmitting }) => {
            if (!labProfile?.id) return
            dispatch(showLoader(editing ? 'Updating service...' : 'Creating service...'))
            try {
              const payload = {
                lab_id: labProfile.id,
                name: values.name,
                description: values.description || null,
                price: Number(values.price),
                duration_minutes: Number(values.duration_minutes),
                result_tat_minutes: Number(values.result_tat_minutes),
                is_active: !!values.is_active,
              }

              if (editing?.id) {
                const { data, error } = await supabase
                  .from('lab_services')
                  .update(payload)
                  .eq('id', editing.id)
                  .select()
                  .single()
                if (error) throw error
                dispatch(updateLabService(data))
                dispatch(
                  showAlert({
                    id: Date.now().toString(),
                    type: 'success',
                    message: 'Service updated.',
                    duration: 4000,
                  })
                )
              } else {
                const { data, error } = await supabase
                  .from('lab_services')
                  .insert(payload)
                  .select()
                  .single()
                if (error) throw error
                dispatch(addLabService(data))
                dispatch(
                  showAlert({
                    id: Date.now().toString(),
                    type: 'success',
                    message: 'Service created.',
                    duration: 4000,
                  })
                )
              }

              setShowModal(false)
              setEditing(null)
            } catch (_e) {
              dispatch(
                showAlert({
                  id: Date.now().toString(),
                  type: 'error',
                  message: 'Failed to save service.',
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
              <Modal.Body>
                <div className="lc-card p-3">
                  <Form.Group className="mb-3">
                    <Form.Label>Service Name</Form.Label>
                    <Form.Control
                      name="name"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.name && !!errors.name}
                      placeholder="e.g., Full Blood Count"
                    />
                    <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={values.description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.description && !!errors.description}
                      placeholder="Short description (optional)"
                    />
                    <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                  </Form.Group>

                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Price (NGN)</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>₦</InputGroup.Text>
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            name="price"
                            value={values.price}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.price && !!errors.price}
                            placeholder="0.00"
                          />
                          <Form.Control.Feedback type="invalid">{errors.price}</Form.Control.Feedback>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Visit Duration (minutes)</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          step="1"
                          name="duration_minutes"
                          value={values.duration_minutes}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.duration_minutes && !!errors.duration_minutes}
                          placeholder="e.g., 30"
                        />
                        <Form.Control.Feedback type="invalid">{errors.duration_minutes}</Form.Control.Feedback>
                        {values.duration_minutes ? (
                          <div className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>
                            Visit: {formatDuration(values.duration_minutes)}
                          </div>
                        ) : null}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Result TAT (minutes)</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          step="1"
                          name="result_tat_minutes"
                          value={values.result_tat_minutes}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.result_tat_minutes && !!errors.result_tat_minutes}
                          placeholder="e.g., 1440"
                        />
                        <Form.Control.Feedback type="invalid">{errors.result_tat_minutes}</Form.Control.Feedback>
                        {values.result_tat_minutes ? (
                          <div className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>
                            Results in: {formatDuration(values.result_tat_minutes)}
                          </div>
                        ) : null}
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mt-3">
                    <Form.Check
                      type="switch"
                      id="is_active"
                      label="Active"
                      checked={!!values.is_active}
                      onChange={(e) => setFieldValue('is_active', e.target.checked)}
                    />
                  </Form.Group>
                </div>
              </Modal.Body>
              <Modal.Footer className="justify-content-between">
                <Button variant="outline-secondary" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editing ? 'Save changes' : 'Create'}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>
    </>
  )
}
