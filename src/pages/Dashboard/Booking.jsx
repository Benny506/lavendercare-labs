import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Form, InputGroup, Modal, Row, Spinner, Table } from 'react-bootstrap'
import {
  IoSearchOutline,
  IoEyeOutline,
  IoCheckmarkCircleOutline,
  IoCloudUploadOutline,
  IoCloseCircleOutline
} from 'react-icons/io5'
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from '../../lib/supabaseClient'
import { hideLoader, showAlert, showLoader } from '../../store/slices/uiSlice'
import { DateTime } from 'luxon'

export default function Booking() {
  const dispatch = useDispatch()
  const { labProfile } = useSelector((s) => s.auth)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fulfillment States
  const [showFulfillModal, setShowFulfillModal] = useState(false)
  const [resultFile, setResultFile] = useState(null)
  const [resultSummary, setResultSummary] = useState('')
  const [fulfillmentNotes, setFulfillmentNotes] = useState('')
  const [isFulfilling, setIsFulfilling] = useState(false)

  const fetchBookings = async () => {
    if (!labProfile?.id) return
    try {
      const { data, error } = await supabase
        .from('lab_bookings')
        .select(`
          *,
          lab_services(name, duration_minutes, result_tat_minutes),
          user_profiles(name, profile_img),
          lab_orders(order_number, payment_status, total_amount)
        `)
        .eq('lab_id', labProfile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBookings(data || [])
    } catch (err) {
      console.error(err)
      dispatch(
        showAlert({
          id: Date.now().toString(),
          type: 'error',
          message: 'Failed to fetch bookings.',
          duration: 4000,
        })
      )
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchBookings()
  }

  useEffect(() => {
    fetchBookings()
  }, [labProfile?.id])

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus = filterStatus === 'all' || b.status === filterStatus
      const customerName = b.user_profiles?.name?.toLowerCase() || ''
      const orderNum = b.lab_orders?.order_number?.toLowerCase() || ''
      const bookingNum = b.booking_number?.toLowerCase() || ''
      const matchesSearch =
        customerName.includes(searchTerm.toLowerCase()) ||
        orderNum.includes(searchTerm.toLowerCase()) ||
        bookingNum.includes(searchTerm.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [bookings, filterStatus, searchTerm])

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
    }
  }, [bookings])

  const updateBookingStatus = async (id, newStatus) => {
    dispatch(showLoader(`Updating status to ${newStatus}...`))
    try {
      const { error } = await supabase
        .from('lab_bookings')
        .update({
          status: newStatus,
          updated_at: new DateTime(Date.now()).toISO()
        })
        .eq('id', id)

      if (error) throw error

      // Update local state
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
      if (selectedBooking?.id === id) {
        setSelectedBooking(prev => ({ ...prev, status: newStatus }))
      }

      dispatch(
        showAlert({
          id: Date.now().toString(),
          type: 'success',
          message: `Booking ${newStatus} successfully.`,
          duration: 3000,
        })
      )
    } catch (err) {
      console.error(err)
      dispatch(
        showAlert({
          id: Date.now().toString(),
          type: 'error',
          message: 'Failed to update status.',
          duration: 4000,
        })
      )
    } finally {
      dispatch(hideLoader())
    }
  }

  const handleFulfillment = async (e) => {
    e.preventDefault()
    if (!resultFile) {
      dispatch(showAlert({ id: 'file-req', type: 'error', message: 'Please upload the result document.' }))
      return
    }

    setIsFulfilling(true)
    try {
      // 1. Upload Result File
      const fileExt = resultFile.name.split('.').pop()
      const fileName = `${selectedBooking.id}-${Date.now()}.${fileExt}`
      const filePath = `results/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('lab_results')
        .upload(filePath, resultFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('lab_results')
        .getPublicUrl(filePath)

      // 2. Update Booking with Result Data
      const { error: updateError } = await supabase
        .from('lab_bookings')
        .update({
          status: 'completed',
          result_url: publicUrl,
          result_summary: resultSummary,
          fulfillment_notes: fulfillmentNotes,
          fulfilled_at: new DateTime(Date.now()).toISO()
        })
        .eq('id', selectedBooking.id)

      if (updateError) throw updateError

      // 3. Cleanup and Success
      dispatch(showAlert({ id: 'ful-success', type: 'success', message: 'Booking fulfilled and completed!' }))
      setShowFulfillModal(false)
      setShowDetails(false)
      fetchBookings()

      // Reset form
      setResultFile(null)
      setResultSummary('')
      setFulfillmentNotes('')

    } catch (err) {
      console.error(err)
      dispatch(showAlert({ id: 'ful-err', type: 'error', message: 'Fulfillment failed. Please try again.' }))
    } finally {
      setIsFulfilling(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <Badge bg="warning" className="text-dark">Pending</Badge>
      case 'confirmed': return <Badge bg="info">Confirmed</Badge>
      case 'completed': return <Badge bg="success">Completed</Badge>
      case 'cancelled': return <Badge bg="danger">Cancelled</Badge>
      default: return <Badge bg="secondary">{status}</Badge>
    }
  }

  const getPaymentBadge = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid': return <Badge bg="success" pill>Paid</Badge>
      case 'unpaid': return <Badge pill style={{ backgroundColor: '#E0E0E0', color: '#616161' }}>Unpaid</Badge>
      default: return <Badge bg="secondary" pill>{paymentStatus}</Badge>
    }
  }

  if (loading && !bookings.length) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="grow" variant="primary" />
      </div>
    )
  }

  return (
    <div className="d-flex flex-column gap-4">
      {/* Stats Row */}
      <Row className="g-3">
        {[
          { label: 'Total Bookings', value: stats.total, color: 'primary' },
          { label: 'Needs Fulfillment', value: stats.pending, color: 'warning' },
          { label: 'Active appointments', value: stats.confirmed, color: 'info' },
          { label: 'Completed', value: stats.completed, color: 'success' },
        ].map((stat, i) => (
          <Col md={3} key={i}>
            <div className="lc-card p-3">
              <div className="text-muted small mb-1">{stat.label}</div>
              <div className={`h4 mb-0 text-${stat.color}`}>{stat.value}</div>
            </div>
          </Col>
        ))}
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <div>
              <h4 className="mb-1">Bookings Management</h4>
              <p className="text-muted mb-0">Monitor and fulfill diagnostic test requests.</p>
            </div>

            <div className="d-flex gap-2 flex-wrap">
              <InputGroup style={{ maxWidth: '300px' }}>
                <InputGroup.Text className="bg-white border-end-0">
                  <IoSearchOutline className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  className="border-start-0 ps-0"
                  placeholder="Search customer or ref..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Form.Select
                style={{ width: '150px' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>

              <Button
                variant="outline-primary"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? <Spinner size="sm" className="me-2" /> : null}
                Refresh
              </Button>
            </div>
          </div>

          <div className="lc-card p-0 overflow-hidden">
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Ref #</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Appointment</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      No matching bookings found.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} style={{ verticalAlign: 'middle' }}>
                      <td>
                        <span className="fw-bold text-primary" style={{ fontSize: '0.9rem' }}>
                          {booking.booking_number || booking.lab_orders?.order_number || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div className="fw-bold">{booking.user_profiles?.name || 'Unknown User'}</div>
                        <div className="text-muted small">ID: {booking.user_id.split('-')[0]}...</div>
                      </td>
                      <td>
                        <div className="fw-medium">{booking.lab_services?.name}</div>
                        <div className="text-muted small">{booking.lab_services?.duration_minutes}m Visit</div>
                      </td>
                      <td>
                        <div className="fw-bold">{DateTime.fromISO(booking.booking_date).toFormat('MMM dd, yyyy')}</div>
                        <div className="text-muted small">{booking.booking_time.slice(0, 5)}</div>
                      </td>
                      <td>{getPaymentBadge(booking.payment_status)}</td>
                      <td>{getStatusBadge(booking.status)}</td>
                      <td className="text-end">
                        <Button
                          variant="link"
                          className="p-0 text-decoration-none"
                          onClick={() => {
                            setSelectedBooking(booking)
                            setShowDetails(true)
                          }}
                        >
                          <IoEyeOutline size={20} className="text-muted" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Details Modal */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Booking Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          {selectedBooking && (
            <div className="p-2">
              <Row className="mb-4">
                <Col md={6}>
                  <div className="text-muted small mb-1">Customer</div>
                  <div className="h5 mb-0">{selectedBooking.user_profiles?.name}</div>
                </Col>
                <Col md={6} className="text-md-end">
                  <div className="text-muted small mb-1">Booking Date</div>
                  <div className="h6 mb-0">{DateTime.fromISO(selectedBooking.created_at).toLocaleString(DateTime.DATETIME_MED)}</div>
                </Col>
              </Row>

              <div className="lc-card bg-light border-0 mb-4">
                <Row className="g-3">
                  <Col sm={4}>
                    <div className="text-muted small">Service</div>
                    <div className="fw-bold">{selectedBooking.lab_services?.name}</div>
                  </Col>
                  <Col sm={4}>
                    <div className="text-muted small">Scheduled For</div>
                    <div className="fw-bold">{DateTime.fromISO(selectedBooking.booking_date).toFormat('DD')} @ {selectedBooking.booking_time.slice(0, 5)}</div>
                  </Col>
                  <Col sm={4}>
                    <div className="text-muted small">Amount</div>
                    <div className="fw-bold text-success">₦{formatNumberWithCommas(selectedBooking.price_at_booking)}</div>
                  </Col>
                </Row>
              </div>

              <div className="mb-4">
                <h6 className="mb-2">Patient Notes</h6>
                <div className="p-3 bg-light rounded" style={{ minHeight: '60px' }}>
                  {selectedBooking.notes || <span className="text-muted italic">No notes provided.</span>}
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-5 pt-3 border-top">
                <div className="d-flex gap-2">
                  <div className="text-muted small me-2">Current Status:</div>
                  {getStatusBadge(selectedBooking.status)}
                  {getPaymentBadge(selectedBooking.payment_status)}
                </div>

                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                  >
                    <IoCheckmarkCircleOutline className="me-2" />
                    Confirm Booking
                  </Button>
                  {selectedBooking.status === 'confirmed' && (
                    <Button
                      variant="success"
                      onClick={() => setShowFulfillModal(true)}
                    >
                      <IoCloudUploadOutline className="me-2" />
                      Fulfill & Complete
                    </Button>
                  )}
                  {['pending', 'confirmed'].includes(selectedBooking.status) && (
                    <Button
                      variant="outline-danger"
                      onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                    >
                      <IoCloseCircleOutline className="me-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Fulfillment Modal */}
      <Modal show={showFulfillModal} onHide={() => setShowFulfillModal(false)} centered size="md">
        <Modal.Header closeButton>
          <Modal.Title>Fulfill Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleFulfillment}>
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">Upload Test Result (PDF/Image)</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setResultFile(e.target.files[0])}
                required
              />
              <Form.Text className="text-muted">
                This document will be securely shared with the patient.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">Clinical Summary</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Briefly summarize the results for the patient..."
                value={resultSummary}
                onChange={(e) => setResultSummary(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">Internal Fulfillment Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Any internal notes or instructions..."
                value={fulfillmentNotes}
                onChange={(e) => setFulfillmentNotes(e.target.value)}
              />
            </Form.Group>

            <div className="d-grid mt-4">
              <Button
                variant="primary"
                type="submit"
                disabled={isFulfilling}
              >
                {isFulfilling ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Uploading Result...
                  </>
                ) : (
                  'Complete & Notify Patient'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .lc-card {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #f0f0f0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        table thead th {
          border-top: none;
          font-weight: 600;
          font-size: 0.85rem;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 12px 16px !important;
        }
        table tbody td {
          padding: 16px !important;
          border-bottom: 1px solid #f8f9fa;
        }
        .bg-light {
          background-color: #f8f9fa !important;
        }
      `}} />
    </div>
  )
}

// Helper
const formatNumberWithCommas = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
