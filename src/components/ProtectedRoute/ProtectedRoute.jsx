import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const { session, user, labProfile, hasBootstrapped } = useSelector((s) => s.auth)

  if (!hasBootstrapped) return null

  const isAuthed = !!session && !!user && !!labProfile
  if (!isAuthed) return <Navigate to="/login" replace />

  return children || <Outlet />
}
