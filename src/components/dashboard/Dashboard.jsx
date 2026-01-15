// src/components/dashboard/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useFinance } from '../../hooks/useFinance'
import { useTasks } from '../../hooks/useTasks'
import { useAnalytics } from '../../hooks/useAnalytics'
import { useFields } from '../../hooks/useFields';
import { getAnimals, subscribeToAnimalLogs } from '../../services/animalsService'
import { subscribeToWarehouseLogs } from '../../hooks/useWarehouse'
import { subscribeToMachineLogs } from '../../services/machinesService'
import {
  getFields,
  getAllFieldYields,
  getFieldStatusLogs // <--- TO JEST KLUCZOWE DLA HISTORII Z BAZY
} from '../../services/fieldsService'
import { subscribeToTaskLogs } from '../../services/tasksHistoryService';
import './Dashboard.css'

// Helper do nazw kategorii
const getCategoryName = (categoryId) => {
  const categories = {
    'sprzedaz_plonow': 'Sprzedaż plonów',
    'sprzedaz_zwierzat': 'Sprzedaż zwierząt',
    'sprzedaz_maszyn': 'Sprzedaż maszyn',
    'dotacje': 'Dotacje',
    'inne_przychody': 'Inne przychody',
    'zwierzeta': 'Zwierzęta',
    'maszyny': 'Maszyny',
    'zboza': 'Nasiona/Sadzonki',
    'nawozy_nasiona': 'Nawozy i nasiona',
    'pasze': 'Pasze',
    'paliwo': 'Paliwo',
    'sprzet_czesci': 'Części i narzędzia',
    'naprawy_konserwacja': 'Naprawy i serwis',
    'inne_koszty': 'Inne koszty',
    'warehouse_stock': 'Stan magazynowy',
    'warehouse_adjustment': 'Korekta magazynowa',
    'warehouse_usage': 'Zużycie materiałów'
  };
  return categories[categoryId] || categoryId;
};

function Dashboard({ farmData, onTabChange }) {
  const { getFinancialSummary, transactions, loading: financeLoading } = useFinance()
  const { tasks, loading: tasksLoading } = useTasks()
  const {
    financialAnalytics,
    fieldAnalytics,
    animalAnalytics,
    warehouseAnalytics,
    alerts,
    loading: analyticsLoading
  } = useAnalytics()

  const [dashboardFarmData, setDashboardFarmData] = useState({
    area: 0,
    animals: 0,
    crops: 0,
    tasks: 0,
    income: 0,
    expenses: 0
  })

  const [fieldHistoryActivities, setFieldHistoryActivities] = useState([])
  const [animalActivities, setAnimalActivities] = useState([])
  const [warehouseActivities, setWarehouseActivities] = useState([])
  const [machineActivities, setMachineActivities] = useState([])
  const [taskActivities, setTaskActivities] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)

  // GŁÓWNY USE EFFECT - POBIERANIE DANYCH
  useEffect(() => {
    let isMounted = true

    const fetchRealData = async () => {
      if (!isMounted) return

      try {
        setLoading(true)
        // Równoległe pobieranie danych z 5 niezależnych serwisów
        const [fields, animals, financialSummary, yields, statusHistoryLog, animalLogs] = await Promise.all([
          getFields(),
          getAnimals(),
          getFinancialSummary(),
          getAllFieldYields(),
          getFieldStatusLogs(20)
        ])

        // 2. Oblicz statystyki
        const totalArea = fields.reduce((sum, field) => sum + (parseFloat(field.area) || 0), 0)
        const animalCount = animals ? animals.length : 0
        const uniqueCrops = [...new Set(fields.map(field => field.crop).filter(Boolean))]

        // 3. PRZETWARZANIE HISTORII
        if (isMounted) {
          const newFieldActivities = []
          const fieldNames = {}
          fields.forEach(f => fieldNames[f.id] = f.name)

          // A. Przetwarzanie zbiorów (zawsze z bazy)
          if (yields && yields.length > 0) {
            yields.forEach(item => {
              newFieldActivities.push({
                id: `yield_${item.id}`,
                title: `Zbiór: ${item.crop}`,
                description: `Pole: ${fieldNames[item.field_id] || 'Nieznane'} - Zebrano: ${item.amount}t`,
                time: item.date_created,
                timestamp: new Date(item.date_created).getTime(),
                icon: '🚜'
              });
            });
          }

          // B. Przetwarzanie historii statusów (zawsze z bazy)
          if (statusHistoryLog && statusHistoryLog.length > 0) {
            statusHistoryLog.forEach(item => {
              const date = item.date_created || item.date_updated

              let activityTitle = ''
              let activityIcon = '🌾'

              // Budowanie opisu
              let activityDesc = `Pole: ${fieldNames[item.field_id] || 'Nieznane'} ${item.crop ? `(${item.crop})` : ''}`

              // Logika wyświetlania tytułów
              switch (item.status) {
                case 'harvested':
                  activityTitle = 'Zbiór upraw'
                  activityIcon = '🚜'
                  // Jeśli w historii zapisano dane o plonie, wyświetl je
                  if (item.yield_amount) {
                    activityDesc += ` - Plon: ${item.yield_amount}t`
                  }
                  if (item.yield_moisture && parseFloat(item.yield_moisture) > 0) {
                    activityDesc += `, Wilgotność: ${item.yield_moisture}%`
                  }
                  break
                case 'sown':
                  activityTitle = 'Zasiano pole'
                  activityIcon = '🌱'
                  break
                case 'ready_for_sowing':
                  activityTitle = 'Pole gotowe do siewu'
                  break
                case 'fallow':
                  activityTitle = 'Pole ugorowane'
                  break
                case 'pasture':
                  activityTitle = 'Przekształcenie w pastwisko'
                  activityIcon = '🐄'
                  break
                default:
                  // Jeśli status jest inny, sformatuj go ładnie (pierwsza litera duża)
                  const label = item.status.charAt(0).toUpperCase() + item.status.slice(1).replace(/_/g, ' ')
                  activityTitle = `Zmiana stanu: ${label}`
              }

              newFieldActivities.push({
                id: `status_${item.id}`,
                title: activityTitle,
                description: activityDesc,
                time: date,
                timestamp: new Date(date).getTime(),
                icon: activityIcon
              })
            })
          }

          // Zapisz historię do stanu
          setFieldHistoryActivities(newFieldActivities)

          // C. Przetwarzanie historii zwierząt
          const newAnimalActivities = []
          if (animalLogs && animalLogs.length > 0) {
            const animalMap = {}
            animals.forEach(a => animalMap[a.id] = a.name || a.type + ' ' + a.earTag)

            animalLogs.forEach(log => {
              const animalName = animalMap[log.animalId] || 'Nieznane zwierzę'
              const date = log.date?.toDate ? log.date.toDate() : new Date(log.date)

              let icon = '🐄'
              if (log.type === 'Leczenie' || log.type === 'Zmiana zdrowia') icon = '💊'
              else if (log.type === 'Ważenie') icon = '⚖️'

              newAnimalActivities.push({
                id: `animal_log_${log.id}`,
                title: `${log.type}: ${animalName}`,
                description: log.description,
                time: date,
                timestamp: date.getTime(),
                icon: icon
              })
            })
          }
          // setAnimalActivities(newAnimalActivities) // <-- Tu już nie ustawiamy, zrobi to subskrypcja


          // Zaktualizuj liczby na dashboardzie
          const updatedFarmData = {
            area: totalArea,
            animals: animalCount,
            crops: uniqueCrops.length,
            tasks: tasks.filter(task => task.status === 'pending').length,
            income: financialSummary?.monthlyIncome || 0,
            expenses: financialSummary?.monthlyExpenses || 0
          }

          setDashboardFarmData(updatedFarmData)
          setHasLoaded(true)
        }

      } catch (error) {
        if (isMounted) {
          console.error('Błąd pobierania danych:', error)
          if (farmData) {
            setDashboardFarmData(farmData)
          }
          setHasLoaded(true)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (!analyticsLoading && !tasksLoading && !financeLoading) {
      fetchRealData()
    }

    return () => {
      isMounted = false
    }
  }, [analyticsLoading, tasksLoading, financeLoading, farmData])

  // SUBSKRYPCJA LOGÓW ZWIERZĄT (Real-time)
  useEffect(() => {
    let animalMap = {}
    // Pobierz nazwy zwierząt raz (lub subskrybuj jeśli potrzeba, ale tu wystarczy fetch)
    const prepareMap = async () => {
      try {
        const animalsData = await getAnimals();
        animalsData.forEach(a => animalMap[a.id] = a.name || a.type + ' ' + a.earTag)
      } catch (e) { console.error(e) }
    }
    prepareMap();

    const unsubscribe = subscribeToAnimalLogs(20, (logs) => {
      console.log('Animal subscription received logs:', logs);
      const newActivities = logs.map(log => {
        const animalName = animalMap[log.animalId] || 'Zwierzę ' + (log.animalId ? log.animalId.substring(0, 4) : 'nieznane');
        // Fallback jeśli mapa jeszcze nie gotowa - nazwy mogą się nie zgadzać przez chwilę, 
        // ale odświeżenie dashboardu to naprawi. W idealnym świecie subskrypcja zwierząt też by tu była.

        let icon = '🐄'
        if (log.type === 'Leczenie' || log.type === 'Zmiana zdrowia') icon = '💊'
        else if (log.type === 'Ważenie') icon = '⚖️'
        else if (log.type === 'Usunięcie') icon = '❌'
        else if (log.type === 'Nowe zwierzę') icon = '✨'

        const date = log.date?.toDate ? log.date.toDate() : new Date(log.date)

        return {
          id: `animal_log_${log.id}`,
          title: `${log.type}: ${animalName}`,
          description: log.description,
          time: date,
          timestamp: date.getTime(),
          icon: icon
        }
      });
      setAnimalActivities(newActivities);
    });

    // Empty dependency array = run on mount

    return () => unsubscribe();
  }, [])

  // SUBSKRYPCJA LOGÓW MAGAZYNU
  useEffect(() => {
    const unsubscribe = subscribeToWarehouseLogs(20, (logs) => {
      const newActivities = logs.map(log => {
        const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp)
        let icon = '📦'
        if (log.operation === 'delete') icon = '🗑️'
        else if (log.operation === 'add') icon = '📥'

        return {
          id: `warehouse_log_${log.id}`,
          title: `Magazyn: ${log.productName || 'Produkt'}${log.quantity ? ` (${log.quantity} ${log.unit || ''})` : ''}`,
          description: log.description,
          time: date,
          timestamp: date.getTime(),
          icon: icon
        }
      })
      setWarehouseActivities(newActivities)
    })
    return () => unsubscribe();
  }, [])



  // SUBSKRYPCJA LOGÓW ZADAŃ
  useEffect(() => {
    const unsubscribe = subscribeToTaskLogs(20, (logs) => {
      const newActivities = logs.map(log => {
        const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        let icon = '📝';
        if (log.type === 'create') icon = '📌';
        else if (log.type === 'update') icon = '✏️';
        else if (log.type === 'status_change') icon = '🔄';
        else if (log.type === 'delete') icon = '🗑️';
        else if (log.type === 'complete') icon = '✅';

        return {
          id: `task_log_${log.id}`,
          title: log.taskTitle || 'Zadanie',
          description: log.description,
          time: date,
          timestamp: date.getTime(),
          icon: icon
        };
      });
      setTaskActivities(newActivities);
    });
    return () => unsubscribe();
  }, []);

  // GENEROWANIE LISTY AKTYWNOŚCI (MERGE)
  useEffect(() => {
    const generateActivities = () => {
      console.log('Generating activities...', {
        transactionsCount: transactions?.length,
        tasksCount: tasks?.length,
        fieldHistoryCount: fieldHistoryActivities?.length,
        animalActivitiesCount: animalActivities?.length,
        warehouseActivitiesCount: warehouseActivities?.length,
        machineActivitiesCount: machineActivities?.length
      });

      let activities = []

      // 1. Transakcje
      if (transactions && transactions.length > 0) {
        transactions.forEach(transaction => {
          const isIncome = transaction.type === 'income'
          const amount = parseFloat(transaction.amount) || 0
          // Używamy createdAt (czas dodania) jeśli dostępny, w przeciwnym razie data transakcji
          const date = transaction.createdAt?.toDate
            ? transaction.createdAt.toDate()
            : (transaction.date?.toDate ? transaction.date.toDate() : new Date(transaction.date))

          let activityTitle = `${isIncome ? 'Przychód' : 'Wydatek'}: ${getCategoryName(transaction.category)}`
          let activityDesc = `${transaction.description || 'Brak opisu'} - ${amount.toLocaleString('pl-PL')} zł`

          // Dla transakcji z magazynu (dodawanie produktu)
          if (transaction.source === 'warehouse' && transaction.productName) {
            const categoryName = getCategoryName(transaction.warehouseCategory || transaction.category);
            activityTitle = `Magazyn: ${transaction.productName} (${transaction.quantity} ${transaction.unit})`
            activityDesc = `Dodano ${categoryName} do magazynu - ${amount.toLocaleString('pl-PL')} zł`
          }

          activities.push({
            id: `transaction_${transaction.id}`,
            title: activityTitle,
            description: activityDesc,
            time: formatTimeAgo(date),
            timestamp: date.getTime(),
            icon: isIncome ? '💰' : '💸'
          })
        })
      }

      // 2. Zadania (Historia z subskrypcji)
      if (taskActivities.length > 0) {
        const formattedTaskActivities = taskActivities.map(activity => ({
          ...activity,
          time: formatTimeAgo(new Date(activity.time))
        }))
        activities = [...activities, ...formattedTaskActivities]
      }


      // 3. Pola (Historia z bazy danych)
      if (fieldHistoryActivities.length > 0) {
        const formattedFieldActivities = fieldHistoryActivities.map(activity => ({
          ...activity,
          // Przeliczamy czas "temu" dynamicznie przy renderowaniu
          time: formatTimeAgo(new Date(activity.time))
        }))
        activities = [...activities, ...formattedFieldActivities]
      }

      // 4. Zwierzęta (Historia z bazy danych)
      if (animalActivities.length > 0) {
        const formattedAnimalActivities = animalActivities.map(activity => ({
          ...activity,
          time: formatTimeAgo(new Date(activity.time))
        }))
        activities = [...activities, ...formattedAnimalActivities]
      }

      // 5. Magazyn (Historia z subskrypcji)
      if (warehouseActivities.length > 0) {
        const formattedWarehouseActivities = warehouseActivities.map(activity => ({
          ...activity,
          time: formatTimeAgo(new Date(activity.time))
        }))
        activities = [...activities, ...formattedWarehouseActivities]
      }

      // 6. Maszyny (Historia z subskrypcji)
      if (machineActivities.length > 0) {
        const formattedMachineActivities = machineActivities.map(activity => ({
          ...activity,
          time: formatTimeAgo(new Date(activity.time))
        }))
        activities = [...activities, ...formattedMachineActivities]
      }

      // 7. Sortowanie wszystkiego po dacie (od najnowszych)
      activities.sort((a, b) => b.timestamp - a.timestamp)

      // 5. Unikanie duplikatów (opcjonalne, na wypadek gdyby zbiór był i w yields i w statusach)
      const uniqueActivities = []
      const seenIds = new Set()

      activities.forEach(act => {
        if (!seenIds.has(act.id)) {
          seenIds.add(act.id)
          uniqueActivities.push(act)
        }
      })

      console.log('Final merged activities:', uniqueActivities);
      return uniqueActivities.slice(0, 20) // Zwiększone do 20
    }

    console.log('Final activities:', generateActivities());
    setRecentActivities(generateActivities())
  }, [transactions, tasks, fieldHistoryActivities, animalActivities, warehouseActivities, machineActivities, taskActivities])

  // --- HELPERY I SZABLON (bez zmian) ---

  const quickActions = [
    {
      id: 1,
      title: 'Dodaj zadanie',
      icon: '➕',
      color: '#4caf50',
      tab: 'tasks',
      action: 'openTaskModal'
    },
    {
      id: 2,
      title: 'Zarejestruj sprzedaż',
      icon: '💰',
      color: '#ff9800',
      tab: 'finance',
      action: 'openIncomeModal'
    },
    {
      id: 3,
      title: 'Dodaj koszt',
      icon: '💸',
      color: '#f44336',
      tab: 'finance',
      action: 'openExpenseModal'
    },
    {
      id: 4,
      title: 'Dodaj zwierzę',
      icon: '🐄',
      color: '#795548',
      tab: 'animals',
      action: 'openAnimalModal'
    },
    {
      id: 5,
      title: 'Dodaj maszynę',
      icon: '🚜',
      color: '#8bc34a',
      tab: 'garage',
      action: 'openMachineModal'
    },
    {
      id: 6,
      title: 'Raport finansowy',
      icon: '📊',
      color: '#2196f3',
      tab: 'reports'
    },
    {
      id: 7,
      title: 'Kalendarz prac',
      icon: '📅',
      color: '#9c27b0',
      tab: 'tasks',
      action: 'openCalendarView'
    }
  ]

  function formatTimeAgo(date) {
    if (!date) return 'Nieznany czas'

    let dateObj
    try {
      if (date?.toDate) {
        dateObj = date.toDate()
      } else if (date?.seconds) {
        dateObj = new Date(date.seconds * 1000)
      } else if (date instanceof Date) {
        dateObj = date
      } else {
        dateObj = new Date(date)
      }

      if (isNaN(dateObj.getTime())) return 'Nieznany czas'
    } catch {
      return 'Nieznany czas'
    }

    const now = new Date()
    const diffMs = now - dateObj
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Przed chwilą'
    if (diffMins < 60) return `${diffMins} min temu`
    if (diffHours < 24) return `${diffHours} godz. temu`
    if (diffDays === 1) return 'Wczoraj'
    if (diffDays < 7) return `${diffDays} dni temu`

    return dateObj.toLocaleDateString('pl-PL')
  }

  function getCategoryName(categoryId) {
    const categoryMap = {
      'sprzedaz_plonow': 'Sprzedaż plonów',
      'sprzedaz_zwierzat': 'Sprzedaż zwierząt',
      'dotacje': 'Dotacje',
      'inne_przychody': 'Inne przychody',
      'zwierzeta': 'Zwierzęta',
      'maszyny': 'Maszyny',
      'zboza': 'Plony',
      'nawozy_nasiona': 'Nawozy i nasiona',
      'pasze': 'Pasza',
      'paliwo': 'Paliwo',
      'sprzet_czesci': 'Narzędzia i części',
      'naprawy_konserwacja': 'Naprawa i konserwacja',
      'inne_koszty': 'Inne koszty'
    }
    return categoryMap[categoryId] || categoryId
  }

  const handleQuickAction = (action) => {
    if (action.tab && onTabChange) {
      onTabChange(action.tab)
      if (action.action === 'openTaskModal') localStorage.setItem('shouldOpenTaskModal', 'true')
      else if (action.action === 'openIncomeModal') {
        localStorage.setItem('shouldOpenIncomeModal', 'true')
        localStorage.setItem('financeActiveTab', 'income')
      } else if (action.action === 'openExpenseModal') {
        localStorage.setItem('shouldOpenExpenseModal', 'true')
        localStorage.setItem('financeActiveTab', 'expenses')
      } else if (action.action === 'openAnimalModal') localStorage.setItem('openAnimalForm', 'true')
      else if (action.action === 'openMachineModal') localStorage.setItem('shouldOpenMachineModal', 'true')
      else if (action.action === 'openCalendarView') localStorage.setItem('shouldOpenCalendarView', 'true')
    }
  }

  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return { value: '0%', isPositive: true }
    const change = ((current - previous) / previous) * 100
    return {
      value: `${change > 0 ? '+' : ''}${change.toFixed(0)}%`,
      isPositive: change > 0
    }
  }

  const previousMonthData = {
    area: dashboardFarmData.area * 0.87,
    animals: dashboardFarmData.animals * 0.82,
    crops: Math.max(dashboardFarmData.crops - 1, 1),
    tasks: dashboardFarmData.tasks * 0.93,
    income: dashboardFarmData.income * 0.85,
    expenses: dashboardFarmData.expenses * 0.78
  }

  if (loading || financeLoading || tasksLoading || analyticsLoading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>Witaj w systemie AgroManager</h2>
          <p>Ładowanie danych...</p>
        </div>
        <div className="loading-spinner">⏳</div>
        <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
          To może chwilę potrwać... Pobieram dane z bazy.
        </p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Witaj w systemie AgroManager</h2>
        <p>Przegląd Twojego gospodarstwa rolnego na dzień {new Date().toLocaleDateString('pl-PL')}</p>
      </div>

      {alerts && alerts.length > 0 && (
        <div className="dashboard-alerts">
          <h3 className="section-title">⚠️ Alerty i powiadomienia</h3>
          <div className="alerts-grid">
            {alerts.slice(0, 3).map((alert, index) => (
              <div key={index} className={`alert-card ${alert.type}`}>
                <div className="alert-icon">
                  {alert.type === 'danger' ? '⚠️' :
                    alert.type === 'warning' ? '🔔' : 'ℹ️'}
                </div>
                <div className="alert-content">
                  <div className="alert-title">{alert.title}</div>
                  <div className="alert-message">{alert.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-stats">
        <h3 className="section-title">📊 Statystyki gospodarstwa</h3>
        <div className="stats-grid">
          <div className="stats-card">
            <div className="stats-content">
              <div className="stats-title">POWIERZCHNIA UPRAW (HA) 🌾</div>
              <div className="stats-value">{dashboardFarmData.area.toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-content">
              <div className="stats-title">LICZBA ZWIERZĄT 🐄</div>
              <div className="stats-value">{dashboardFarmData.animals.toLocaleString('pl-PL')}</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-content">
              <div className="stats-title">RODZAJE UPRAW 🌱</div>
              <div className="stats-value">{dashboardFarmData.crops}</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-content">
              <div className="stats-title">ZADANIA DO WYKONANIA ✅</div>
              <div className="stats-value">{dashboardFarmData.tasks}</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-content">
              <div className="stats-title">PRZYCHODY (ZŁ) 💰</div>
              <div className="stats-value">{dashboardFarmData.income.toLocaleString('pl-PL')}</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-content">
              <div className="stats-title">WYDATKI (ZŁ) 💸</div>
              <div className="stats-value">{dashboardFarmData.expenses.toLocaleString('pl-PL')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3 className="section-title">⚡ Szybkie akcje</h3>
        <div className="actions-grid">
          {quickActions.map(action => (
            <div
              key={action.id}
              className="action-card"
              onClick={() => handleQuickAction(action)}
              style={{ cursor: 'pointer' }}
            >
              <div
                className="action-icon"
                style={{ backgroundColor: action.color }}
              >
                {action.icon}
              </div>
              <div className="action-title">{action.title}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="recent-activities">
        <h3 className="section-title">🕐 Ostatnie aktywności</h3>
        <div className="activities-list">
          {recentActivities.length > 0 ? (
            recentActivities.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-content">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-desc">{activity.description}</div>
                </div>
                <div className="activity-time">{activity.time}</div>
              </div>
            ))
          ) : (
            <div className="no-activities">
              <div className="activity-icon">📝</div>
              <div className="activity-content">
                <div className="activity-title">Brak ostatnich aktywności</div>
                <div className="activity-desc">Rozpocznij korzystanie z systemu</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="analytics-summary">
        <h3 className="section-title">📈 Podsumowanie analityczne</h3>
        <div className="analytics-grid">
          <div className="analytics-card">
            <h4>💰 Finanse</h4>
            <p>Bilans miesięczny: {(dashboardFarmData.income - dashboardFarmData.expenses).toLocaleString('pl-PL')} zł</p>
            <p>Przychody: {dashboardFarmData.income.toLocaleString('pl-PL')} zł</p>
            <p>Wydatki: {dashboardFarmData.expenses.toLocaleString('pl-PL')} zł</p>
          </div>

          <div className="analytics-card">
            <h4>🌾 Produkcja</h4>
            <p>Powierzchnia: {dashboardFarmData.area.toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ha</p>
            <p>Wykorzystanie pól: {fieldAnalytics?.fieldUtilization?.utilizationRate?.toFixed(1) || 0}%</p>
            <p>Rodzaje upraw: {dashboardFarmData.crops}</p>
          </div>

          <div className="analytics-card">
            <h4>📦 Magazyn i zwierzęta</h4>
            <p>Zwierzęta: {dashboardFarmData.animals} szt.</p>
            <p>Wartość zapasów: {warehouseAnalytics?.inventoryValue?.toLocaleString('pl-PL') || 0} zł</p>
            <p>Niskie stany: {warehouseAnalytics?.stockLevels?.lowStock || 0} produktów</p>
            <p>Kondycja stada: {animalAnalytics?.health?.healthIndex?.toFixed(1) || 0}%</p>
          </div>
        </div>
      </div>

      <div className="dashboard-footer">
        <p>
          <strong>Dane aktualne:</strong> {new Date().toLocaleString('pl-PL')} |
          <strong> Liczba transakcji:</strong> {transactions?.length || 0} |
          <strong> Liczba zadań:</strong> {tasks?.length || 0}
        </p>
        <p className="footer-note">
          Aktualizacja danych w czasie rzeczywistym. Wszystkie kwoty w PLN.
        </p>
      </div>
    </div>
  )
}

export default Dashboard