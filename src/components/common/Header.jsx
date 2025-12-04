// components/Header.jsx
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import './Header.css'

const Header = () => {
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Nowa wiadomość', text: 'Masz nową wiadomość od administratora', time: '5 min temu', read: false },
    { id: 2, title: 'Aktualizacja systemu', text: 'System zostanie zaktualizowany o 22:00', time: '1 godzinę temu', read: false },
    { id: 3, title: 'Powiadomienie', text: 'Twoje zadanie zostało ukończone', time: '2 godziny temu', read: true },
  ])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const notificationsRef = useRef(null)

  const handleLogout = async () => {
    await logout()
  }

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
    // Oznacz jako przeczytane po otwarciu
    if (!showNotifications) {
      const updatedNotifications = notifications.map(notif => ({
        ...notif,
        read: true
      }))
      setNotifications(updatedNotifications)
    }
  }

  const markAsRead = (id) => {
    const updatedNotifications = notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    )
    setNotifications(updatedNotifications)
  }

  const clearAllNotifications = () => {
    setNotifications([])
    setShowNotifications(false)
  }

  // Licz nieprzeczytane powiadomienia
  useEffect(() => {
    const count = notifications.filter(notif => !notif.read).length
    setUnreadCount(count)
  }, [notifications])

  // Zamknij powiadomienia po kliknięciu poza
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className="header">
      <div className="header-left">
        {/* Możesz dodać logo tutaj jeśli chcesz */}
      </div>
      
      <div className="header-right">
        <div className="notifications-container" ref={notificationsRef}>
          <button 
            className="notifications-button"
            onClick={toggleNotifications}
            aria-label="Powiadomienia"
          >
            <span className="bell-icon">🔔</span>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h3>Powiadomienia ({notifications.length})</h3>
                {notifications.length > 0 && (
                  <button 
                    className="clear-all-btn"
                    onClick={clearAllNotifications}
                  >
                    Wyczyść wszystkie
                  </button>
                )}
              </div>

              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="no-notifications">
                    <p>Brak powiadomień</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id}
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="notification-content">
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-text">{notification.text}</div>
                        <div className="notification-time">{notification.time}</div>
                      </div>
                      {!notification.read && (
                        <div className="unread-dot"></div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
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
      </div>
    </header>
  )
}

export default Header