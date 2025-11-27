// components/Header.jsx
import { useAuth } from '../hooks/useAuth'
import './Header.css'

const Header = () => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="header">
      <div className="search-bar">
        <input type="text" placeholder="Szukaj..." />
      </div>
      <div className="user-info">
        <div className="user-avatar">
          {user?.email?.charAt(0).toUpperCase()}
        </div>
        <div className="user-details">
          <div className="user-name">
            {user?.displayName || user?.email?.split('@')[0]}
          </div>
          <div className="user-role">Użytkownik</div>
        </div>
        <button 
          onClick={handleLogout}
          className="logout-button"
          title="Zostaniesz automatycznie wylogowany po 1 minucie nieaktywności"
        >
          Wyloguj
        </button>
      </div>
    </header>
  )
}

export default Header