import { useEffect, useState } from 'react'
import { Card, Button, Form, Row, Col, Badge } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from '../../lib/supabaseClient'
import { setLabProfile, setLabAvailability } from '../../store/slices/authSlice'
import { showLoader, hideLoader, showAlert } from '../../store/slices/uiSlice'
import { fetchDashboardSummary } from '../../store/slices/dashboardSlice'
import { FiCalendar, FiClock, FiSettings, FiActivity } from 'react-icons/fi'

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export default function Availability() {
  const dispatch = useDispatch()
  const { labProfile, labAvailability } = useSelector((s) => s.auth)

  // Lab Capacity (Total Bays) State
  const [localBays, setLocalBays] = useState(1)
  const [savingBays, setSavingBays] = useState(false)

  // Operating Schedule State
  const [schedule, setSchedule] = useState({})
  const [savingSchedule, setSavingSchedule] = useState(false)

  // Initialize values when Redux store is updated or on mount
  useEffect(() => {
    if (labProfile?.capacity_bays) {
      setLocalBays(labProfile.capacity_bays)
    }
  }, [labProfile])

  useEffect(() => {
    const initial = {}
    DAYS_OF_WEEK.forEach((d) => {
      const match = (labAvailability || []).find((a) => Number(a.day_of_week) === d.value)
      initial[d.value] = {
        isOpen: !!match,
        open_time: match?.open_time ? String(match.open_time).substring(0, 5) : '08:00',
        close_time: match?.close_time ? String(match.close_time).substring(0, 5) : '17:00',
      }
    })
    setSchedule(initial)
  }, [labAvailability])

  // Handle Lab Capacity (Total Bays) Save
  const handleUpdateBays = async (e) => {
    e.preventDefault()
    if (!labProfile?.id) return

    setSavingBays(true)
    dispatch(showLoader('Updating lab capacity...'))

    try {
      const { data, error } = await supabase
        .from('labs')
        .update({ capacity_bays: Number(localBays) })
        .eq('id', labProfile.id)
        .select()
        .single()

      if (error) throw error

      dispatch(setLabProfile(data))
      dispatch(
        showAlert({
          id: Date.now().toString(),
          type: 'success',
          message: 'Lab capacity updated successfully.',
          duration: 4000,
        })
      )
    } catch (err) {
      console.error(err)
      dispatch(
        showAlert({
          id: Date.now().toString(),
          type: 'error',
          message: 'Failed to update lab capacity.',
          duration: 6000,
        })
      )
    } finally {
      dispatch(hideLoader())
      setSavingBays(false)
    }
  }

  // Handle Day Toggle (isOpen check)
  const handleDayToggle = (dayValue) => {
    setSchedule((prev) => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        isOpen: !prev[dayValue].isOpen,
      },
    }))
  }

  // Handle Time Change
  const handleTimeChange = (dayValue, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        [field]: value,
      },
    }))
  }

  // Handle Operating Hours Schedule Save
  const handleSaveSchedule = async () => {
    if (!labProfile?.id) return

    setSavingSchedule(true)
    dispatch(showLoader('Saving operating hours...'))

    try {
      const activeDays = []
      const disabledDays = []

      DAYS_OF_WEEK.forEach((d) => {
        const dayConfig = schedule[d.value]
        if (dayConfig?.isOpen) {
          activeDays.push({
            lab_id: labProfile.id,
            day_of_week: d.value,
            open_time: `${dayConfig.open_time}:00`,
            close_time: `${dayConfig.close_time}:00`,
          })
        } else {
          disabledDays.push(d.value)
        }
      })

      // 1. Upsert active/open days
      if (activeDays.length > 0) {
        const { error: upsertError } = await supabase
          .from('lab_availability')
          .upsert(activeDays, { onConflict: 'lab_id,day_of_week' })
        if (upsertError) throw upsertError
      }

      // 2. Delete disabled/closed days
      if (disabledDays.length > 0) {
        const { error: deleteError } = await supabase
          .from('lab_availability')
          .delete()
          .eq('lab_id', labProfile.id)
          .in('day_of_week', disabledDays)
        if (deleteError) throw deleteError
      }

      // 3. Fetch latest availability rows
      const { data: updatedAvailability, error: fetchError } = await supabase
        .from('lab_availability')
        .select('*')
        .eq('lab_id', labProfile.id)
        .order('day_of_week', { ascending: true })

      if (fetchError) throw fetchError

      dispatch(setLabAvailability(updatedAvailability || []))
      
      // 4. Reload dashboard summary parameters (open status, availability status)
      dispatch(fetchDashboardSummary())

      dispatch(
        showAlert({
          id: Date.now().toString(),
          type: 'success',
          message: 'Operating hours saved successfully.',
          duration: 4000,
        })
      )
    } catch (err) {
      console.error(err)
      dispatch(
        showAlert({
          id: Date.now().toString(),
          type: 'error',
          message: 'Failed to save operating hours.',
          duration: 6000,
        })
      )
    } finally {
      dispatch(hideLoader())
      setSavingSchedule(false)
    }
  }

  return (
    <div className="d-flex flex-column gap-4">
      {/* Page Header */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-1">Availability & Capacity</h4>
              <p className="text-muted mb-0">Set your operating schedule and testing station limits.</p>
            </div>
            <Badge bg="primary">
              <FiCalendar className="me-1" /> Active Schedule
            </Badge>
          </div>
        </Card.Body>
      </Card>

      <Row className="g-4">
        {/* Lab Capacity Card */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex flex-column justify-content-between gap-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <FiActivity className="text-primary fs-5" />
                  <h5 className="mb-0">Lab Capacity</h5>
                </div>
                <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: '1.45' }}>
                  Define the total number of physical testing bays or screening stations that can operate concurrently in your lab.
                </p>
                <div className="alert alert-info border-0 p-3 mt-3" style={{ fontSize: '0.85rem' }}>
                  <strong>How it's used:</strong> This value is processed by the mobile booking engine to calculate real-time patient queue delays, busy-ness status, and warning alerts.
                </div>
              </div>

              <Form onSubmit={handleUpdateBays}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small">Total Screening Bays</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    step="1"
                    value={localBays}
                    onChange={(e) => setLocalBays(e.target.value)}
                    placeholder="e.g. 2"
                    required
                  />
                </Form.Group>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-100"
                  disabled={savingBays || localBays === (labProfile?.capacity_bays || 1)}
                >
                  {savingBays ? 'Updating...' : 'Update Capacity'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Operating Schedule Card */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center gap-2 mb-4">
                <FiClock className="text-primary fs-5" />
                <h5 className="mb-0">Weekly Operating Hours</h5>
              </div>

              <div className="d-flex flex-column gap-3 mb-4">
                {DAYS_OF_WEEK.map((d) => {
                  const dayConfig = schedule[d.value] || { isOpen: false, open_time: '08:00', close_time: '17:00' }
                  return (
                    <div
                      key={d.value}
                      className={`lc-card p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 transition ${
                        dayConfig.isOpen ? 'border-primary' : 'bg-light'
                      }`}
                    >
                      <div style={{ minWidth: 120 }}>
                        <Form.Check
                          type="switch"
                          id={`toggle-${d.value}`}
                          label={<span className="fw-bold">{d.label}</span>}
                          checked={dayConfig.isOpen}
                          onChange={() => handleDayToggle(d.value)}
                        />
                      </div>

                      {dayConfig.isOpen ? (
                        <div className="d-flex align-items-center gap-2 flex-grow-1 justify-content-md-end">
                          <Form.Group className="mb-0">
                            <Form.Control
                              type="time"
                              size="sm"
                              value={dayConfig.open_time}
                              onChange={(e) => handleTimeChange(d.value, 'open_time', e.target.value)}
                            />
                          </Form.Group>
                          <span className="text-muted small">to</span>
                          <Form.Group className="mb-0">
                            <Form.Control
                              type="time"
                              size="sm"
                              value={dayConfig.close_time}
                              onChange={(e) => handleTimeChange(d.value, 'close_time', e.target.value)}
                              isInvalid={dayConfig.open_time >= dayConfig.close_time}
                            />
                          </Form.Group>
                        </div>
                      ) : (
                        <span className="text-muted small ms-md-auto">Closed / Unavailable</span>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="d-flex justify-content-end">
                <Button
                  onClick={handleSaveSchedule}
                  variant="primary"
                  disabled={savingSchedule}
                  style={{ minWidth: 160 }}
                >
                  {savingSchedule ? 'Saving...' : 'Save Schedule'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
