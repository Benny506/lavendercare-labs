import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabaseClient'

const initialState = {
  isLoaded: false,
  lastUpdatedAt: null,
  servicesCount: 0,
  activeServicesCount: 0,
  inactiveServicesCount: 0,
  bookingsCount: 0,
  availabilitySet: false,
  availableToday: false,
  openNow: false,
  todayAvailability: null,
  error: null,
}

const pad2 = (n) => String(n).padStart(2, '0')

const getNowHHMM = () => {
  const d = new Date()
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export const fetchDashboardSummary = createAsyncThunk('dashboard/fetchDashboardSummary', async (_, { getState, rejectWithValue }) => {
  const { auth } = getState()
  const labId = auth?.labProfile?.id
  if (!labId) return rejectWithValue('Missing lab profile')

  const availability = Array.isArray(auth?.labAvailability) ? auth.labAvailability : []
  const services = Array.isArray(auth?.labServices) ? auth.labServices : []

  const today = new Date().getDay()
  const todaySlots = availability.filter((a) => Number(a?.day_of_week) === today)
  const todayAvailability = todaySlots.length > 0 ? todaySlots[0] : null

  const nowHHMM = getNowHHMM()
  const openNow = !!(
    todayAvailability?.open_time &&
    todayAvailability?.close_time &&
    String(todayAvailability.open_time) <= nowHHMM &&
    nowHHMM <= String(todayAvailability.close_time)
  )

  let servicesCount = services.length
  try {
    const { count, error } = await supabase.from('lab_services').select('id', { count: 'exact', head: true }).eq('lab_id', labId)
    if (error) throw error
    if (typeof count === 'number') servicesCount = count
  } catch (_e) {}

  let bookingsCount = 0
  try {
    const res = await supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('lab_id', labId)
    if (res.error) {
      const alt = await supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('provider_id', labId)
      if (alt.error) throw alt.error
      bookingsCount = typeof alt.count === 'number' ? alt.count : 0
    } else {
      bookingsCount = typeof res.count === 'number' ? res.count : 0
    }
  } catch (_e) {}

  const activeServicesCount = services.filter((s) => s?.is_active).length
  const inactiveServicesCount = services.filter((s) => s?.is_active === false).length

  return {
    servicesCount,
    activeServicesCount,
    inactiveServicesCount,
    bookingsCount,
    availabilitySet: availability.length > 0,
    availableToday: todaySlots.length > 0,
    openNow,
    todayAvailability,
    lastUpdatedAt: new Date().toISOString(),
  }
})

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboard: (state) => {
      Object.assign(state, initialState)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.isLoaded = true
        state.error = null
        state.lastUpdatedAt = action.payload.lastUpdatedAt
        state.servicesCount = action.payload.servicesCount
        state.activeServicesCount = action.payload.activeServicesCount
        state.inactiveServicesCount = action.payload.inactiveServicesCount
        state.bookingsCount = action.payload.bookingsCount
        state.availabilitySet = action.payload.availabilitySet
        state.availableToday = action.payload.availableToday
        state.openNow = action.payload.openNow
        state.todayAvailability = action.payload.todayAvailability
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.error = action.payload || action.error?.message || 'Failed to load dashboard'
      })
  },
})

export const { clearDashboard } = dashboardSlice.actions
export default dashboardSlice.reducer

