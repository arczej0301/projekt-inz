function Header() {
    return (
      <div className="header">
        <div className="search-bar">
          <input type="text" placeholder="Wyszukaj..." />
        </div>
        <div className="user-info">
          <div className="notifications" style={{cursor: 'pointer', fontSize: '1.2rem'}}>🔔</div>
          <div className="user-avatar">JR</div>
          <div className="user-details">
            <div className="user-name">Jan Rolnik</div>
            <div className="user-role">Właściciel</div>
          </div>
        </div>
      </div>
    )
  }
  
  export default Header