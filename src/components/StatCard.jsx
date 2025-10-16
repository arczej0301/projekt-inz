function StatCard({ title, value, change, icon }) {
    const isPositive = change >= 0
    
    return (
      <div className="stat-card">
        <div className="stat-card-header">
          <div className="stat-card-title">{title}</div>
          <div className="stat-card-icon">{icon}</div>
        </div>
        <div className="stat-card-value">{value}</div>
        <div className={`stat-card-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(change)}%
        </div>
      </div>
    )
  }
  
  export default StatCard