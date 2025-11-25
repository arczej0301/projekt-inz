import './InactivityWarning.css';
import { useAuth } from '../hooks/useAuth'

const InactivityWarning = () => {
  const { showWarning, countdown, updateUserActivity } = useAuth()

  if (!showWarning) return null

  return (
    <div 
      className="inactivity-warning"
      onClick={updateUserActivity} // Kliknięcie w ostrzeżenie resetuje timer
    >
      <div className="warning-content">
        <h3>⚠️ Sesja wygaśnie za {countdown} sekund</h3>
        <p>Kliknij tutaj lub wykonaj jakąkolwiek akcję, aby pozostać zalogowanym</p>
      </div>
    </div>
  )
}

export default InactivityWarning