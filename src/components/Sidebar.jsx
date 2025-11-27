function Sidebar({ activeTab, setActiveTab }) {
    const menuItems = [
      { id: 'dashboard', label: 'Pulpit', icon: '📊' },
      { id: 'fields', label: 'Pola uprawne', icon: '🌾' },
      { id: 'animals', label: 'Zwierzęta', icon: '🐄' },
<<<<<<< HEAD
      { id: 'magazine', label: 'Magazyn', icon: '📦' },
=======
      { id: 'magazine', label: 'Magazyn', icon: '' },
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce
      { id: 'garage', label: 'Garaż', icon: '🚜' },
      { id: 'tasks', label: 'Zadania', icon: '✅' },
      { id: 'finance', label: 'Finanse', icon: '💰' },
      { id: 'reports', label: 'Raporty', icon: '📈' },
      { id: 'settings', label: 'Ustawienia', icon: '⚙️' },
      { id: 'test', label: '🧪 Test', icon: '🧪' }, // DODANA POZYCJA
    ]
  
    return (
      <div className="sidebar">
        <div className="logo">
          <h1><span className="logo-icon">🚜</span> AgroManager</h1>
        </div>
        <ul className="nav-menu">
          {menuItems.map(item => (
            <li 
              key={item.id} 
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  
  export default Sidebar