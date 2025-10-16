import { useAuth } from '../hooks/useAuth'

const Header = () => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="header">
      <div className="search-bar">
        <input type="text" placeholder="Szukaj..." />
      </div>
      <div className="user-info">
        <div className="user-avatar">
          {user?.email?.charAt(0).toUpperCase()}
        </div>
        <div className="user-details">
          <div className="user-name">{user?.email}</div>
          <div className="user-role">Użytkownik</div>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Wyloguj
        </button>
      </div>
    </div>
  )
}

export default Header