import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Col, ProgressBar, Row, Spinner } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchDashboardSummary } from '../../store/slices/dashboardSlice'
import { hideLoader, showAlert, showLoader } from '../../store/slices/uiSlice'

export default function DashboardMain() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { labProfile, labAvailability } = useSelector((s) => s.auth)
  const dashboard = useSelector((s) => s.dashboard)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!labProfile?.id) return
    const firstLoad = !dashboard.isLoaded
    ;(async () => {
      if (firstLoad) {
        dispatch(showLoader('Loading dashboard...'))
      } else {
        setRefreshing(true)
      }
      try {
        await dispatch(fetchDashboardSummary()).unwrap()
      } catch (_e) {
        dispatch(
          showAlert({
            id: Date.now().toString(),
            type: 'error',
            message: 'Failed to refresh dashboard.',
            duration: 6000,
          })
        )
      } finally {
        if (firstLoad) dispatch(hideLoader())
        setRefreshing(false)
      }
    })()
  }, [dispatch, labProfile?.id])

  const availabilitySet = useMemo(() => (labAvailability || []).length > 0, [labAvailability])

  const todayLabel = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[new Date().getDay()]
  }, [])

  const profileCompleteness = useMemo(() => {
    const labels = {
      name: 'Lab name',
      contact_email: 'Contact email',
      phone: 'Phone',
      address: 'Address',
      profile_img: 'Profile image',
    }
    const checks = [
      { key: 'name', ok: !!labProfile?.name },
      { key: 'contact_email', ok: !!labProfile?.contact_email },
      { key: 'phone', ok: !!labProfile?.phone },
      { key: 'address', ok: !!labProfile?.address },
      { key: 'profile_img', ok: !!labProfile?.profile_img },
    ]
    const done = checks.filter((c) => c.ok).length
    const total = checks.length
    const percent = total === 0 ? 0 : Math.round((done / total) * 100)
    const missing = checks.filter((c) => !c.ok).map((c) => labels[c.key] || c.key)
    return { done, total, percent, missing }
  }, [labProfile])

  const updatedAtLabel = useMemo(() => {
    if (!dashboard.lastUpdatedAt) return 'Not updated yet'
    const d = new Date(dashboard.lastUpdatedAt)
    return d.toLocaleString()
  }, [dashboard.lastUpdatedAt])

  return (
    <div className="d-flex flex-column gap-3">
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start gap-3">
            <div>
              <h4 className="mb-1">Overview</h4>
              <p className="text-muted mb-0">Quick snapshot of your lab activity and setup.</p>
              <div className="text-muted mt-2" style={{ fontSize: '0.9rem' }}>
                <span>Last updated: {updatedAtLabel}</span>
                {refreshing ? (
                  <span className="ms-2">
                    <Spinner animation="border" size="sm" />
                  </span>
                ) : null}
              </div>
            </div>
            <Badge bg={availabilitySet ? 'success' : 'secondary'}>{availabilitySet ? 'Ready' : 'Setup needed'}</Badge>
          </div>
        </Card.Body>
      </Card>

      <Row className="g-3">
        <Col md={4}>
          <div className="lc-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                  Total services
                </div>
                <div className="fw-bold" style={{ fontSize: '1.6rem' }}>
                  {dashboard.servicesCount}
                </div>
                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                  {dashboard.activeServicesCount} active · {dashboard.inactiveServicesCount} inactive
                </div>
              </div>
              <Button variant="outline-primary" size="sm" onClick={() => navigate('/dashboard/services')}>
                Manage
              </Button>
            </div>
          </div>
        </Col>

        <Col md={4}>
          <div className="lc-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                  Total bookings
                </div>
                <div className="fw-bold" style={{ fontSize: '1.6rem' }}>
                  {dashboard.bookingsCount}
                </div>
                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                  Track incoming requests & schedule
                </div>
              </div>
              <Button variant="outline-primary" size="sm" onClick={() => navigate('/dashboard/booking')}>
                View
              </Button>
            </div>
          </div>
        </Col>

        <Col md={4}>
          <div className="lc-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                  Availability
                </div>
                <div className="fw-bold" style={{ fontSize: '1.1rem' }}>
                  {availabilitySet ? 'Set' : 'Not set'}
                </div>
                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                  {todayLabel}:{' '}
                  <span className={dashboard.availableToday ? 'text-success' : 'text-muted'}>
                    {dashboard.availableToday ? (dashboard.openNow ? 'Open now' : 'Available today') : 'Not available today'}
                  </span>
                </div>
              </div>
              <Button variant={availabilitySet ? 'outline-primary' : 'primary'} size="sm" onClick={() => navigate('/dashboard/availability')}>
                {availabilitySet ? 'Edit' : 'Set up'}
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={7}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="mb-1">Quick Actions</h5>
                  <p className="text-muted mb-0">Jump straight into common tasks.</p>
                </div>
              </div>

              <div className="mt-3 d-flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => navigate('/dashboard/services')}>
                  Create / Edit Services
                </Button>
                <Button variant="outline-primary" onClick={() => navigate('/dashboard/availability')}>
                  Set Availability
                </Button>
                <Button variant="outline-primary" onClick={() => navigate('/dashboard/booking')}>
                  View Bookings
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate('/dashboard/profile')}>
                  Update Profile
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="mb-1">Profile Health</h5>
                  <p className="text-muted mb-0">Complete profiles convert better.</p>
                </div>
                <Badge bg={profileCompleteness.percent >= 80 ? 'success' : profileCompleteness.percent >= 50 ? 'warning' : 'secondary'}>
                  {profileCompleteness.percent}%
                </Badge>
              </div>

              <div className="mt-3">
                <ProgressBar now={profileCompleteness.percent} style={{ height: 10 }} />
              </div>

              {profileCompleteness.missing.length > 0 ? (
                <div className="text-muted mt-3" style={{ fontSize: '0.9rem' }}>
                  Missing: {profileCompleteness.missing.join(', ')}
                </div>
              ) : (
                <div className="text-success mt-3" style={{ fontSize: '0.9rem' }}>
                  Profile looks complete.
                </div>
              )}

              <div className="mt-3 d-flex justify-content-end">
                <Button variant="outline-primary" size="sm" onClick={() => navigate('/dashboard/profile')}>
                  Review
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
