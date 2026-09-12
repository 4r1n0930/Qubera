import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Home } from './Home'

export function HomeRedirect() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Home />
}