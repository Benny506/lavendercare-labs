import GlobalLoader from './components/GlobalLoader/GlobalLoader'
import GlobalAlerts from './components/GlobalAlerts/GlobalAlerts'
import { Routes, Route, Navigate, HashRouter, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Signup from './pages/Signup/Signup.jsx'
import Otp from './pages/Otp/Otp.jsx'
import Login from './pages/Login/Login.jsx'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword/ResetPassword.jsx'
import DashboardLayout from './layouts/Dashboard/DashboardLayout.jsx'
import DashboardMain from './pages/Dashboard/DashboardMain.jsx'
import Services from './pages/Dashboard/Services.jsx'
import Booking from './pages/Dashboard/Booking.jsx'
import Availability from './pages/Dashboard/Availability.jsx'
import Profile from './pages/Dashboard/Profile.jsx'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx'
import { authBootstrapFromSession } from './lib/authBootstrap'
import { hideLoader, showLoader } from './store/slices/uiSlice'
import { markBootstrapped } from './store/slices/authSlice'
import './App.css'

function AutoLoginGate() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const hasBootstrapped = useSelector((s) => s.auth.hasBootstrapped)

  useEffect(() => {
    if (hasBootstrapped) return
    ;(async () => {
      dispatch(showLoader('Restoring session...'))
      try {
        const res = await authBootstrapFromSession({ dispatch })
        if (!res.ok && location.pathname.startsWith('/dashboard')) {
          navigate('/login', { replace: true })
        }
      } finally {
        dispatch(markBootstrapped())
        dispatch(hideLoader())
      }
    })()
  }, [dispatch, navigate, location.pathname, hasBootstrapped])

  return null
}

function App() {
  return (
    <HashRouter>
      <GlobalAlerts />
      <GlobalLoader />
      <AutoLoginGate />
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/otp" element={<Otp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardMain />} />
          <Route path="services" element={<Services />} />
          <Route path="booking" element={<Booking />} />
          <Route path="availability" element={<Availability />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
