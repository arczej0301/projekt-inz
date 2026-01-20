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
    // Kategorie magazynowe (zgodne z useWarehouse)
    'zboza': 'Zboża',
    'nawozy': 'Nawozy',
    'pasze': 'Pasze',
    'paliwo': 'Paliwa i oleje',
    'narzedzia': 'Narzędzia i części',
    // Mapowanie starych/innych ID dla kompatybilności
    'nawozy_nasiona': 'Nawozy',
    'sprzet_czesci': 'Narzędzia i części',
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



          // Helper do tłumaczenia statusów
          const getStatusLabel = (status) => {
            const labels = {
              'sown': 'zasiane',
              'harvested': 'zebrane',
              'ready_for_sowing': 'gotowe do siewu',
              'fallow': 'ugór',
              'pasture': 'pastwisko',
              'ploughed': 'zaorane'
            };
            return labels[status] || status;
          };

          // B. Przetwarzanie historii statusów (zawsze z bazy)
          if (statusHistoryLog && statusHistoryLog.length > 0) {
            statusHistoryLog.forEach(item => {
              const date = item.date_created || item.date_updated

              let activityTitle = ''
              let activityIcon = '🌾'

              // Budowanie opisu
              let activityDesc = `Pole: ${fieldNames[item.field_id] || 'Nieznane'} ${item.crop ? `(${item.crop})` : ''}`

              // Logika wyświetlania tytułów
              // Logika wyświetlania tytułów
              // LOGIKA WYŚWIETLANIA TYTUŁÓW I OPISÓW

              const itemStatus = item.status;
              const activitiesFromThisLog = [];
              const name = item.field_name || (fieldNames[item.field_id] || 'Nieznane');

              // 1. Zbiór (Harvest) - jeśli jest płon, to jest zbiór.
              if (itemStatus === 'harvested' && item.yield_amount) {
                let desc = `${name} - zebrano ${item.crop || 'nieznana uprawa'} - Plon: ${item.yield_amount}t`;
                if (item.yield_moisture && parseFloat(item.yield_moisture) > 0) {
                  desc += `, Wilgotność: ${item.yield_moisture}%`;
                }
                activitiesFromThisLog.push({
                  title: 'Pola uprawne: Zbiór upraw',
                  icon: '🚜',
                  description: desc
                });
              } else {
                // Jeśli to nie zbiór, to sprawdzamy inne zmiany niezależnie

                // 2. Zmiana uprawy (Crop Change)
                const prevCrop = item.previous_crop || '';
                const currCrop = item.crop || '';
                if (prevCrop !== currCrop) {
                  activitiesFromThisLog.push({
                    title: 'Pola uprawne: Zmiana uprawy',
                    icon: '🌱',
                    description: `${name} zmieniono uprawę z "${prevCrop}" na "${currCrop}"`
                  });
                }

                // 3. Zmiana statusu
                if (item.previous_status && item.previous_status !== itemStatus) {
                  if (itemStatus === 'sown') {
                    activitiesFromThisLog.push({
                      title: 'Pola uprawne: Zasiano pole',
                      icon: '🌱',
                      description: `Na polu ${name} zasiano ${item.crop || 'nieznaną uprawę'}`
                    });
                  } else {
                    const oldLabel = getStatusLabel(item.previous_status);
                    const newLabel = getStatusLabel(itemStatus);
                    activitiesFromThisLog.push({
                      title: 'Pola uprawne: Zmiana stanu pola',
                      icon: '🔄',
                      description: `${name} zmieniono stan pola z "${oldLabel}" na "${newLabel}"`
                    });
                  }
                }

                // 4. Edycja pola
                if (itemStatus === 'field_edited') {
                  activitiesFromThisLog.push({
                    title: 'Pola uprawne: Edycja pola',
                    icon: '✏️',
                    description: `${name} - ${item.change_details}`
                  });
                }

                // 5. Fallback - jeśli nic nie wykryto
                if (activitiesFromThisLog.length === 0) {
                  if (itemStatus === 'field_added') {
                    const area = item.area ? `${item.area} ha` : '';
                    activitiesFromThisLog.push({
                      title: 'Pola uprawne: Dodano pole',
                      icon: '🆕',
                      description: `${name} zostało dodane ${area ? `- ${area}` : ''}`
                    });
                  } else if (itemStatus === 'field_deleted') {
                    const area = item.area ? `${item.area} ha` : '';
                    activitiesFromThisLog.push({
                      title: 'Pola uprawne: Usunięto pole',
                      icon: '🗑️',
                      description: `${name} zostało usunięte ${area ? `- ${area}` : ''}`
                    });
                  } else {
                    // Standardowy fallback
                    let activityTitle = '', activityIcon = '🌾';
                    switch (itemStatus) {
                      case 'harvested': activityTitle = 'Zmiana stanu: Zebrane'; activityIcon = '🌾'; break;
                      case 'sown': activityTitle = 'Zasiano pole'; activityIcon = '�'; break;
                      case 'ready_for_sowing': activityTitle = 'Zmiana stanu: Gotowe do siewu'; break;
                      case 'fallow': activityTitle = 'Zmiana stanu: Ugór'; break;
                      case 'pasture': activityTitle = 'Zmiana stanu: Pastwisko'; activityIcon = '🐄'; break;
                      case 'ploughed': activityTitle = 'Zmiana stanu: Zaorane'; activityIcon = '�'; break;
                      default:
                        const label = itemStatus.charAt(0).toUpperCase() + itemStatus.slice(1).replace(/_/g, ' ');
                        activityTitle = `Zmiana stanu: ${label}`;
                    }
                    activitiesFromThisLog.push({
                      title: activityTitle,
                      icon: activityIcon,
                      description: `Pole: ${name} ${item.crop ? `(${item.crop})` : ''}`
                    });
                  }
                }
              }

              activitiesFromThisLog.forEach((act, index) => {
                newFieldActivities.push({
                  id: `status_${item.id}_${index}`,
                  title: act.title,
                  description: act.description,
                  time: date,
                  timestamp: new Date(date).getTime(),
                  icon: act.icon
                })
              })
            });
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
        animalsData.forEach(a => animalMap[a.id] = a) // Store full object
      } catch (e) { console.error(e) }
    }
    prepareMap();

    const unsubscribe = subscribeToAnimalLogs(20, async (logs) => {
      console.log('Animal subscription received logs:', logs);

      // Sprawdź czy mamy wszystkie te zwierzęta w mapie, jeśli nie to odśwież
      const missingIds = logs.some(log => log.animalId && !animalMap[log.animalId]);
      if (missingIds) {
        try {
          console.log('Refreshing animal map for new logs...');
          const animalsData = await getAnimals();
          animalsData.forEach(a => animalMap[a.id] = a); // Store full object
        } catch (e) { console.error('Error refreshing animals:', e); }
      }
      const newActivities = logs.map(log => {
        const animalObj = animalMap[log.animalId];
        const animalName = animalObj?.name || (animalObj?.type ? `${animalObj.type} ${animalObj.earTag || ''}` : 'Zwierzę ' + (log.animalId ? log.animalId.substring(0, 4) : 'nieznane'));

        // Fallback jeśli mapa jeszcze nie gotowa - nazwy mogą się nie zgadzać przez chwilę, 
        // ale odświeżenie dashboardu to naprawi. W idealnym świecie subskrypcja zwierząt też by tu była.

        let icon = '🐄'
        if (log.type === 'Leczenie' || log.type === 'Zmiana zdrowia') icon = '💊'
        else if (log.type === 'Ważenie') icon = '⚖️'
        else if (log.type === 'Usunięcie') icon = '❌'
        else if (log.type === 'Nowe zwierzę') icon = '✨'
        else if (log.type === 'Edycja danych') icon = '✏️'

        const date = log.date?.toDate ? log.date.toDate() : new Date(log.date)

        let title = `${log.type}: ${animalName}`;
        let description = log.description;

        if (log.type === 'Nowe zwierzę') {
          title = 'Zwierzęta: Dodano zwierzę';
          // Używamy opisu z loga, który zawiera nazwę zapisaną w momencie utworzenia.
          description = log.description;

          // Wsteczna kompatybilność
          if (description && description.startsWith('Dodano zwierzę: ')) {
            const extractedName = description.replace('Dodano zwierzę: ', '');
            description = `${extractedName} zostało dodane do listy zwierząt`;
          }
        } else if (log.type === 'Usunięcie') {
          title = 'Zwierzęta: Usunięto zwierzę';
          description = log.description;
        } else if (log.type === 'Edycja danych') {
          title = 'Zwierzęta: Edycja danych';
          description = log.description;
          // Wsteczna kompatybilność
          if (description === 'Zmieniono dane identyfikacyjne zwierzęcia') {
            description = `Zmieniono dane identyfikacyjne zwierzęcia ${animalName}`;
          }
        } else if (log.type === 'Leczenie') {
          title = 'Zwierzęta: Leczenie';
          // Format: [name zwierzecia] ([nr kolczyka]) - [opis zdarzenia]
          const earTagPart = animalObj?.earTag ? `(${animalObj.earTag})` : '';
          description = `${animalName} ${earTagPart} - Opis: ${log.description}`;
        }

        return {
          id: `animal_log_${log.id}`,
          title: title,
          description: description,
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
      // Filtrujemy 'add', bo jest już obsługiwane przez logi transakcji (żeby nie dublować)
      const filteredLogs = logs.filter(log => log.operation !== 'add');

      const newActivities = filteredLogs.map(log => {
        const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp)
        let icon = '📦'
        if (log.operation === 'delete') icon = '🗑️'

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

  // SUBSKRYPCJA LOGÓW MASZYN
  useEffect(() => {
    const unsubscribe = subscribeToMachineLogs(20, (logs) => {
      const newActivities = logs.map(log => {
        const date = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        let icon = '🚜';
        let title = 'Maszyna';
        let description = log.description;

        if (log.type === 'Nowa maszyna') {
          title = 'Garaż: Dodano maszynę';
          icon = '🚜';
          // Usuń prefix 'Dodano maszynę: ' jeśli istnieje, aby zostawić samo [Nazwa] [Marka] [Model]
          if (description && description.startsWith('Dodano maszynę: ')) {
            description = description.replace('Dodano maszynę: ', '');
          }
        } else if (log.type === 'Usunięcie') {
          title = 'Garaż: Usunięto maszynę';
          icon = '🗑️';
        } else if (log.type === 'Zmiana statusu') {
          title = 'Garaż: Zmiana statusu maszyny';
          icon = '🔄';
        } else {
          title = `Garaż: ${log.type}`;
        }

        return {
          id: `machine_log_${log.id}`,
          title: title,
          description: description,
          time: date,
          timestamp: date.getTime(),
          icon: icon
        }
      });
      setMachineActivities(newActivities);
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
            activityTitle = `Magazyn: Dodano produkt`;
            activityDesc = `${transaction.productName} (${transaction.quantity} ${transaction.unit}) - ${amount.toLocaleString('pl-PL')} zł`;
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
      return uniqueActivities.slice(0, 10) // Zwiększone do 20
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
          <h3 className="section-title">⚠️ Alerty i Rekomendacje</h3>
          <div className="alerts-grid">
            {alerts.map((alert, index) => (
              <div key={index} className={`alert-card ${alert.type} ${alert.priority}`}>
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
    </div>
  )
}

export default Dashboard