// components/pages/GaragePage.jsx
import { useState } from 'react'
import { useGarage } from '../../hooks/useGarage'
import MachineModal from './MachineModal'
import RepairModal from './RepairModal'
import RepairHistory from './RepairHistory'
import './GaragePage.css'

function GaragePage() {
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false)
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false)
  const [viewRepairHistory, setViewRepairHistory] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { 
    machines, 
    loading, 
    error,
    addMachine,
    updateMachine,
    deleteMachine,
    addRepair,
    deleteRepair
  } = useGarage()

  const filteredMachines = machines.filter(machine =>
    machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.brand.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'sprawna': return '#4caf50'
      case 'do_naprawy': return '#ff9800'
      case 'zepsuta': return '#f44336'
      default: return '#9e9e9e'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'sprawna': return 'Sprawna'
      case 'do_naprawy': return 'Do naprawy'
      case 'zepsuta': return 'Zepsuta'
      default: return 'Nieznany'
    }
  }

  const calculateTotalRepairCosts = (machine) => {
    if (!machine.repairs) return 0
    return machine.repairs.reduce((total, repair) => total + (repair.cost || 0), 0)
  }

  const handleAddMachine = () => {
    setSelectedMachine(null)
    setIsMachineModalOpen(true)
  }

  const handleEditMachine = (machine) => {
    setSelectedMachine(machine)
    setIsMachineModalOpen(true)
  }

  const handleAddRepair = (machine) => {
    setSelectedMachine(machine)
    setIsRepairModalOpen(true)
  }

  const handleViewRepairs = (machine) => {
    setViewRepairHistory(machine)
  }

  const handleSaveMachine = async (machineData, imageFile) => {
    if (selectedMachine) {
      const result = await updateMachine(selectedMachine.id, machineData, imageFile)
      if (result.success) {
        setIsMachineModalOpen(false)
        setSelectedMachine(null)
      } else {
        alert(`Błąd: ${result.error}`)
      }
    } else {
      const result = await addMachine(machineData, imageFile)
      if (result.success) {
        setIsMachineModalOpen(false)
      } else {
        alert(`Błąd: ${result.error}`)
      }
    }
  }

  const handleSaveRepair = async (repairData) => {
    if (selectedMachine) {
      const result = await addRepair(selectedMachine.id, repairData)
      if (result.success) {
        setIsRepairModalOpen(false)
        setSelectedMachine(null)
      } else {
        alert(`Błąd: ${result.error}`)
      }
    }
  }

  const handleDeleteMachine = async (machine) => {
    if (window.confirm(`Czy na pewno chcesz usunąć maszynę "${machine.name}"?`)) {
      const result = await deleteMachine(machine.id, machine.imageUrl)
      if (!result.success) {
        alert(`Błąd: ${result.error}`)
      }
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Ładowanie danych garażu...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>❌ Błąd</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Odśwież stronę</button>
      </div>
    )
  }

  return (
    <div className="garage-page">
      <div className="garage-header">
        <h2>🚜 Garaż Maszyn</h2>
        <p>Zarządzanie maszynami i pojazdami w gospodarstwie</p>
      </div>

      <div className="garage-stats">
        <div className="stat-card">
          <div className="stat-icon">🚜</div>
          <div className="stat-info">
            <h3>Łączna liczba maszyn</h3>
            <p>{machines.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-info">
            <h3>Wymagają naprawy</h3>
            <p>{machines.filter(m => m.status === 'do_naprawy').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Łączny koszt napraw</h3>
            <p>{machines.reduce((total, machine) => total + calculateTotalRepairCosts(machine), 0).toFixed(2)} zł</p>
          </div>
        </div>
      </div>

      <div className="garage-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Szukaj maszyny, marki, typu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        <button className="btn-primary" onClick={handleAddMachine}>
          + Dodaj maszynę
        </button>
      </div>

      <div className="machines-grid">
        {filteredMachines.map(machine => (
          <div key={machine.id} className="machine-card">
            <div className="machine-image">
              {machine.imageUrl ? (
                <img src={machine.imageUrl} alt={machine.name} />
              ) : (
                <div className="no-image">🚜</div>
              )}
              <div 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(machine.status) }}
              >
                {getStatusText(machine.status)}
              </div>
            </div>

            <div className="machine-info">
              <h3>{machine.name}</h3>
              <div className="machine-details">
                <div className="detail-item">
                  <span className="label">Marka:</span>
                  <span className="value">{machine.brand}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Typ:</span>
                  <span className="value">{machine.type}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Rok prod.:</span>
                  <span className="value">{machine.year}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Numer rej.:</span>
                  <span className="value">{machine.registration || 'Brak'}</span>
                </div>
                {machine.lastService && (
                  <div className="detail-item">
                    <span className="label">Ostatni serwis:</span>
                    <span className="value">
                      {machine.lastService.toDate ? 
                        machine.lastService.toDate().toLocaleDateString('pl-PL') : 
                        machine.lastService
                      }
                    </span>
                  </div>
                )}
              </div>

              <div className="repair-summary">
                <div className="repair-count">
                  Liczba napraw: {machine.repairs?.length || 0}
                </div>
                <div className="repair-cost">
                  Koszt napraw: {calculateTotalRepairCosts(machine).toFixed(2)} zł
                </div>
              </div>
            </div>

            <div className="machine-actions">
              <button 
                className="btn-primary"
                onClick={() => handleEditMachine(machine)}
              >
                Edytuj
              </button>
              <button 
                className="btn-secondary"
                onClick={() => handleAddRepair(machine)}
              >
                Dodaj naprawę
              </button>
              <button 
                className="btn-info"
                onClick={() => handleViewRepairs(machine)}
              >
                Historia
              </button>
              <button 
                className="btn-danger"
                onClick={() => handleDeleteMachine(machine)}
              >
                Usuń
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMachines.length === 0 && (
        <div className="no-machines">
          <p>🚜 Brak maszyn w garażu</p>
          <button className="btn-primary" onClick={handleAddMachine}>
            Dodaj pierwszą maszynę
          </button>
        </div>
      )}

      {isMachineModalOpen && (
        <MachineModal
          machine={selectedMachine}
          onSave={handleSaveMachine}
          onClose={() => {
            setIsMachineModalOpen(false)
            setSelectedMachine(null)
          }}
        />
      )}

      {isRepairModalOpen && selectedMachine && (
        <RepairModal
          machine={selectedMachine}
          onSave={handleSaveRepair}
          onClose={() => {
            setIsRepairModalOpen(false)
            setSelectedMachine(null)
          }}
        />
      )}

      {viewRepairHistory && (
        <RepairHistory
          machine={viewRepairHistory}
          onClose={() => setViewRepairHistory(null)}
          onDeleteRepair={deleteRepair}
        />
      )}
    </div>
  )
}

export default GaragePage