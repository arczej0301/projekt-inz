import { useAuth } from '../hooks/useAuth'
import LoginPage from '../pages/LoginPage'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Ładowanie...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return children
}

export default ProtectedRoute