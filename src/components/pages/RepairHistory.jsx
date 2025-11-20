// components/pages/RepairHistory.jsx
import './GarageModals.css'

function RepairHistory({ machine, onClose, onDeleteRepair }) {
  const repairs = machine.repairs || []

  const handleDeleteRepair = async (repairId) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten wpis naprawy?')) {
      const result = await onDeleteRepair(machine.id, repairId)
      if (!result.success) {
        alert(`Błąd: ${result.error}`)
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'sprawna': return '#4caf50'
      case 'do_naprawy': return '#ff9800'
      case 'zepsuta': return '#f44336'
      default: return '#9e9e9e'
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Historia napraw - {machine.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="repair-history">
          {repairs.length === 0 ? (
            <div className="no-repairs">
              <p>📝 Brak historii napraw dla tej maszyny</p>
            </div>
          ) : (
            <div className="repairs-list">
              {repairs.map(repair => (
                <div key={repair.id} className="repair-item">
                  <div className="repair-header">
                    <div className="repair-date">
                      {repair.date?.toDate ? 
                        repair.date.toDate().toLocaleDateString('pl-PL') : 
                        repair.date
                      }
                    </div>
                    <div 
                      className="repair-status"
                      style={{ backgroundColor: getStatusColor(repair.status) }}
                    >
                      {repair.status === 'sprawna' ? 'Sprawna' : 
                       repair.status === 'do_naprawy' ? 'Do naprawy' : 'Zepsuta'}
                    </div>
                    <button 
                      className="delete-repair"
                      onClick={() => handleDeleteRepair(repair.id)}
                      title="Usuń naprawę"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="repair-description">
                    {repair.description}
                  </div>
                  
                  <div className="repair-details">
                    <div className="repair-cost">
                      <strong>Koszt:</strong> {repair.cost?.toFixed(2)} zł
                    </div>
                    {repair.mechanic && (
                      <div className="repair-mechanic">
                        <strong>Mechanik:</strong> {repair.mechanic}
                      </div>
                    )}
                    {repair.parts && (
                      <div className="repair-parts">
                        <strong>Części:</strong> {repair.parts}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>
            Zamknij
          </button>
        </div>
      </div>
    </div>
  )
}

export default RepairHistory