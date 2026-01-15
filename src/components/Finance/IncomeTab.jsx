// components/Finance/IncomeTab.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useFinance } from '../../hooks/useFinance'
import { useWarehouse } from '../../hooks/useWarehouse'
import { getAnimals, deleteAnimal } from '../../services/animalsService'
import { garageService } from '../../services/garageService';
import CustomSelect from '../common/CustomSelect'
import './FinanceComponents.css'

const IncomeTab = ({ transactions }) => {
  const { incomeCategories, addTransaction } = useFinance()
  const { warehouseData, categories: warehouseCategories } = useWarehouse()

  // Stan dla wybranego okresu
  const [period, setPeriod] = useState('yearly') // yearly, quarterly, monthly

  // Opcje dla selektora okresu
  const periodOptions = [
    { value: 'yearly', label: 'Rok', icon: '📈' },
    { value: 'quarterly', label: 'Kwartał', icon: '📊' },
    { value: 'monthly', label: 'Miesiąc', icon: '📅' }
  ]

  const [showAddForm, setShowAddForm] = useState(() => {
    return localStorage.getItem('openIncomeForm') === 'true';
  })

  useEffect(() => {
    const shouldOpenForm = localStorage.getItem('openIncomeForm');
    if (shouldOpenForm === 'true') {
      setShowAddForm(true);
      localStorage.removeItem('openIncomeForm');
    }
  }, []);

  const [machinesData, setMachinesData] = useState([])
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [loadingMachines, setLoadingMachines] = useState(false)

  /// Stan dla sortowania
  const [sortOption, setSortOption] = useState('date_desc')
  const [filterOption, setFilterOption] = useState('all')

  const [newTransaction, setNewTransaction] = useState({
    type: 'income',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    productId: '',
    quantity: '',
    unit: '',
    animalId: ''
  })

  const [availableProducts, setAvailableProducts] = useState([])
  const [animalsData, setAnimalsData] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [loading, setLoading] = useState(false)

  const prevCategoryRef = useRef('')
  const prevProductIdRef = useRef('')
  const prevAnimalIdRef = useRef('')
  const prevQuantityRef = useRef('')

  // Static formatter functions
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0,00 zł'
    }
    const numAmount = parseFloat(amount)
    const formatted = numAmount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return `${formatted} zł`
  }

  const formatNumber = (number) => {
    if (number === null || number === undefined || isNaN(number)) return '0'
    const num = parseFloat(number)
    if (num % 1 !== 0) {
      return num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  // Funkcja do tłumaczenia statusu maszyny
  const translateMachineStatus = (status) => {
    const statusMap = {
      'active': 'Aktywy',
      'inactive': 'Nieaktywny',
      'maintenance': 'W konserwacji',
      'repair': 'W naprawie',
      'sold': 'Sprzedany',
      'available': 'Dostępny',
      'unavailable': 'Niedostępny'
    };

    return statusMap[status.toLowerCase()] || status;
  };

  // Funkcja do ikon zwierząt
  const getAnimalIcon = (animalType) => {
    const icons = {
      'krowa': '🐄',
      'byk': '🐂',
      'świnia': '🐖',
      'koń': '🐎',
      'owca': '🐑',
      'koza': '🐐',
      'kura': '🐔',
      'indyk': '🦃',
      'kaczka': '🦆',
      'gęś': '🦢'
    }
    return icons[animalType] || '🐾'
  }

  // Memoized options
  const categoryOptions = useMemo(() =>
    incomeCategories.map(cat => ({
      value: cat.id,
      label: cat.name,
      icon: cat.icon
    })),
    [incomeCategories]
  )

  const productOptions = useMemo(() =>
    availableProducts.map(product => {
      const cat = warehouseCategories.find(c => c.id === product.category)
      return {
        value: product.id,
        label: `${product.name} (${formatNumber(product.quantity)} ${product.unit})`,
        subLabel: `Cena: ${formatCurrency(product.price || 0)}/${product.unit} | Kategoria: ${cat?.name || product.category}`,
        icon: cat?.icon || '📦'
      }
    }),
    [availableProducts, warehouseCategories]
  )

  const animalOptions = useMemo(() =>
    animalsData.map(animal => ({
      value: animal.id,
      label: `${animal.name} (${animal.earTag}) - ${animal.type} ${animal.breed ? `- ${animal.breed}` : ''}`,
      subLabel: `Waga: ${animal.weight || '?'} kg | Status: ${animal.status}`,
      icon: getAnimalIcon(animal.type)
    })),
    [animalsData]
  )

  // Opcje sortowania i filtrowania
  const sortOptions = [
    { value: 'date_desc', label: 'Najnowsze' },
    { value: 'date_asc', label: 'Najstarsze' },
    { value: 'amount_desc', label: 'Największe kwoty' },
    { value: 'amount_asc', label: 'Najmniejsze kwoty' },
    { value: 'category', label: 'Kategoria A-Z' }
  ]

  const filterOptions = [
    { value: 'all', label: 'Wszystkie kategorie' },
    { value: 'sprzedaz_plonow', label: 'Sprzedaż plonów' },
    { value: 'sprzedaz_zwierzat', label: 'Sprzedaż zwierząt' },
    { value: 'sprzedaz_maszyn', label: 'Sprzedaż maszyn' },
    { value: 'dotacje', label: 'Dotacje' },
    { value: 'inne_przychody', label: 'Inne przychody' }
  ]

  // Funkcja do pobierania daty transakcji
  const getTransactionDate = (t) => {
    if (t.date?.toDate) return t.date.toDate()
    if (t.date instanceof Date) return t.date
    if (typeof t.date === 'string') return new Date(t.date)
    if (t.createdAt?.toDate) return t.createdAt.toDate()
    return new Date(t.date || t.createdAt || 0)
  }

  // Funkcja do filtrowania transakcji według okresu
  const getFilteredTransactionsByPeriod = useMemo(() => {
    const now = new Date()

    let startDate = new Date()
    let endDate = new Date()

    switch (period) {
      case 'yearly':
        endDate = now
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break

      case 'quarterly':
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth()
        const previousQuarter = Math.floor((currentMonth - 1) / 3)

        if (previousQuarter < 0) {
          startDate = new Date(currentYear - 1, 9, 1)
          endDate = new Date(currentYear - 1, 11, 31, 23, 59, 59)
        } else {
          const quarterStartMonth = previousQuarter * 3
          startDate = new Date(currentYear, quarterStartMonth, 1)
          endDate = new Date(currentYear, quarterStartMonth + 3, 0, 23, 59, 59)
        }
        break

      case 'monthly':
        const currentYearNow = now.getFullYear()
        const currentMonthNow = now.getMonth()

        if (currentMonthNow === 0) {
          startDate = new Date(currentYearNow - 1, 11, 1)
          endDate = new Date(currentYearNow - 1, 11, 31, 23, 59, 59)
        } else {
          startDate = new Date(currentYearNow, currentMonthNow - 1, 1)
          endDate = new Date(currentYearNow, currentMonthNow, 0, 23, 59, 59)
        }
        break

      default:
        endDate = now
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    }

    return transactions.filter(transaction => {
      const transactionDate = getTransactionDate(transaction)
      return transactionDate >= startDate && transactionDate <= endDate
    })
  }, [transactions, period])

  // Etykiety dla okresu
  const getPeriodLabel = () => {
    const now = new Date()
    const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']

    switch (period) {
      case 'yearly':
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        const startDay = oneYearAgo.getDate()
        const startMonth = monthNames[oneYearAgo.getMonth()]
        const startYear = oneYearAgo.getFullYear()
        const endDay = now.getDate()
        const endMonth = monthNames[now.getMonth()]
        const endYear = now.getFullYear()

        return `${startDay} ${startMonth.toLowerCase()} ${startYear} - ${endDay} ${endMonth.toLowerCase()} ${endYear}`

      case 'quarterly':
        const currentMonth = now.getMonth()
        const quarterNames = ['I kwartał', 'II kwartał', 'III kwartał', 'IV kwartał']

        let quarterIndex = Math.floor((currentMonth - 1) / 3)
        let year = now.getFullYear()

        if (quarterIndex < 0) {
          quarterIndex = 3
          year = year - 1
        }

        return `${quarterNames[quarterIndex]} ${year}`

      case 'monthly':
        let monthIndex = now.getMonth() - 1
        let monthYear = now.getFullYear()

        if (monthIndex < 0) {
          monthIndex = 11
          monthYear = monthYear - 1
        }

        return `${monthNames[monthIndex]} ${monthYear}`

      default:
        return `Ostatnie 12 miesięcy`
    }
  }

  // Effect 1: Filtrowanie produktów gdy zmienia się kategoria
  useEffect(() => {
    if (newTransaction.category === 'sprzedaz_plonow') {
      const allProducts = Object.values(warehouseData).flat()
      const sellableProducts = allProducts.filter(product =>
        ['zboza', 'warzywa', 'owoce', 'mleko'].includes(product.category) &&
        (product.quantity || 0) > 0
      )
      setAvailableProducts(sellableProducts)

      if (newTransaction.productId) {
        const productStillAvailable = sellableProducts.some(p => p.id === newTransaction.productId)
        if (!productStillAvailable) {
          setNewTransaction(prev => ({
            ...prev,
            productId: '',
            quantity: '',
            unit: ''
          }))
        }
      }
    } else {
      setAvailableProducts([])
      setSelectedProduct(null)
      if (newTransaction.productId || newTransaction.quantity) {
        setNewTransaction(prev => ({
          ...prev,
          productId: '',
          quantity: '',
          unit: ''
        }))
      }
    }
    prevCategoryRef.current = newTransaction.category
  }, [newTransaction.category, warehouseData])

  // Effect 2: Pobieranie zwierząt dla sprzedaży zwierząt
  useEffect(() => {
    if (newTransaction.category === 'sprzedaz_zwierzat') {
      fetchAnimals()
    } else {
      setAnimalsData([])
      setSelectedAnimal(null)
      if (newTransaction.animalId) {
        setNewTransaction(prev => ({
          ...prev,
          animalId: '',
          amount: ''
        }))
      }
    }
  }, [newTransaction.category])

  const fetchAnimals = async () => {
    try {
      const animals = await getAnimals()
      setAnimalsData(animals)
    } catch (error) {
      console.error('Błąd przy pobieraniu zwierząt:', error)
    }
  }

  // Effect 3: Ustawianie selectedProduct gdy zmienia się productId
  useEffect(() => {
    if (newTransaction.productId && availableProducts.length > 0 && prevProductIdRef.current !== newTransaction.productId) {
      const product = availableProducts.find(p => p.id === newTransaction.productId)
      setSelectedProduct(product || null)
      prevProductIdRef.current = newTransaction.productId

      if (product && !newTransaction.description.includes(product.name)) {
        setNewTransaction(prev => ({
          ...prev,
          description: `Sprzedaż ${product.name}`,
          unit: product.unit
        }))
      }
    } else if (!newTransaction.productId && selectedProduct) {
      setSelectedProduct(null)
    }
  }, [newTransaction.productId, availableProducts])

  // Effect 4: Ustawianie selectedAnimal gdy zmienia się animalId
  useEffect(() => {
    if (newTransaction.animalId && animalsData.length > 0 && prevAnimalIdRef.current !== newTransaction.animalId) {
      const animal = animalsData.find(a => a.id === newTransaction.animalId)
      setSelectedAnimal(animal || null)
      prevAnimalIdRef.current = newTransaction.animalId

      if (animal && !newTransaction.description.includes(animal.name)) {
        setNewTransaction(prev => ({
          ...prev,
          description: `Sprzedaż ${animal.name} (${animal.earTag})`,
          amount: ''
        }))
      }
    } else if (!newTransaction.animalId && selectedAnimal) {
      setSelectedAnimal(null)
    }
  }, [newTransaction.animalId, animalsData])

  // Effect 5: Obliczanie kwoty gdy zmienia się ilość (tylko dla produktów)
  useEffect(() => {
    if (selectedProduct && newTransaction.quantity && prevQuantityRef.current !== newTransaction.quantity) {
      const quantity = parseFloat(newTransaction.quantity)
      if (!isNaN(quantity) && quantity > 0) {
        const totalAmount = (selectedProduct.price || 0) * quantity
        setNewTransaction(prev => ({
          ...prev,
          amount: totalAmount.toString()
        }))
      }
      prevQuantityRef.current = newTransaction.quantity
    } else if (!newTransaction.quantity && selectedProduct) {
      setNewTransaction(prev => ({
        ...prev,
        amount: ''
      }))
    }
  }, [newTransaction.quantity, selectedProduct])

  const fetchMachines = async () => {
    try {
      setLoadingMachines(true)
      const machines = await garageService.getAllMachines()
      const availableMachines = machines.filter(machine =>
        machine.status !== 'sold' && machine.status !== 'sprzedany'
      )
      setMachinesData(availableMachines)
    } catch (error) {
      console.error('Błąd przy pobieraniu maszyn:', error)
      setMachinesData([])
    } finally {
      setLoadingMachines(false)
    }
  }

  // Effect 6: Pobieranie maszyn dla sprzedaży maszyn
  useEffect(() => {
    if (newTransaction.category === 'sprzedaz_maszyn') {
      fetchMachines()
    } else {
      setMachinesData([])
      setSelectedMachine(null)
      if (newTransaction.machineId) {
        setNewTransaction(prev => ({
          ...prev,
          machineId: '',
          amount: ''
        }))
      }
    }
  }, [newTransaction.category])

  // Effect 7: Ustawianie selectedMachine gdy zmienia się machineId
  useEffect(() => {
    if (newTransaction.machineId && machinesData.length > 0) {
      const machine = machinesData.find(m => m.id === newTransaction.machineId)
      setSelectedMachine(machine || null)

      if (machine && !newTransaction.description.includes(machine.name)) {
        setNewTransaction(prev => ({
          ...prev,
          description: `Sprzedaż maszyny: ${machine.name}`,
          amount: machine.purchasePrice ? machine.purchasePrice.toString() : ''
        }))
      }
    } else if (!newTransaction.machineId && selectedMachine) {
      setSelectedMachine(null)
    }
  }, [newTransaction.machineId, machinesData])

  const handleMachineChange = useCallback((machineId) => {
    if (newTransaction.machineId === machineId) return

    setNewTransaction(prev => ({
      ...prev,
      machineId: machineId,
      amount: ''
    }))
  }, [newTransaction.machineId])

  const machineOptions = useMemo(() =>
    machinesData.map(machine => {
      const categoryText = categoryOptions.find(opt => opt.value === machine.category)?.label || machine.category
      return {
        value: machine.id,
        label: `${machine.name} (${machine.brand || 'Brak marki'} ${machine.model || ''})`,
        subLabel: `Kategoria: ${categoryText} | Rok: ${machine.year || '?'} | Status: ${translateMachineStatus(machine.status)}`,
        icon: '🚜'
      }
    }),
    [machinesData, categoryOptions]
  )

  const getMachineIcon = (category) => {
    const icons = {
      'tractor': '🚜',
      'harvester': '🌾',
      'plow': '⚙️',
      'seeder': '🌱',
      'sprayer': '💧',
      'trailer': '🚚',
      'truck': '🚛',
      'other': '🛠️'
    }
    return icons[category] || '🚜'
  }

  // Sortowanie i filtrowanie transakcji
  const sortedTransactions = useMemo(() => {
    let filtered = [...getFilteredTransactionsByPeriod]

    // Filtrowanie
    if (filterOption !== 'all') {
      filtered = filtered.filter(t => t.category === filterOption)
    }

    // Sortowanie
    return filtered.sort((a, b) => {
      const dateA = getTransactionDate(a)
      const dateB = getTransactionDate(b)

      switch (sortOption) {
        case 'date_asc':
          return dateA.getTime() - dateB.getTime()

        case 'date_desc':
        default:
          return dateB.getTime() - dateA.getTime()

        case 'amount_desc':
          return b.amount - a.amount

        case 'amount_asc':
          return a.amount - b.amount

        case 'category':
          const catA = incomeCategories.find(c => c.id === a.category)?.name || a.category
          const catB = incomeCategories.find(c => c.id === b.category)?.name || b.category
          return catA.localeCompare(catB)
      }
    })
  }, [getFilteredTransactionsByPeriod, sortOption, filterOption, incomeCategories])

  const totalIncome = useMemo(() =>
    sortedTransactions.reduce((sum, t) => sum + t.amount, 0),
    [sortedTransactions]
  )

  // Handlers
  const handleCategoryChange = useCallback((value) => {
    setNewTransaction(prev => {
      if (prev.category === value) return prev
      return {
        type: 'income',
        category: value,
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        productId: '',
        quantity: '',
        unit: '',
        animalId: ''
      }
    })
    setSelectedProduct(null)
    setSelectedAnimal(null)
  }, [])

  const handleProductChange = useCallback((productId) => {
    if (newTransaction.productId === productId) return

    setNewTransaction(prev => ({
      ...prev,
      productId: productId,
      quantity: '',
      amount: ''
    }))
  }, [newTransaction.productId])

  const handleAnimalChange = useCallback((animalId) => {
    if (newTransaction.animalId === animalId) return

    setNewTransaction(prev => ({
      ...prev,
      animalId: animalId,
      amount: ''
    }))
  }, [newTransaction.animalId])

  const handleQuantityChange = useCallback((e) => {
    const value = e.target.value
    setNewTransaction(prev => ({
      ...prev,
      quantity: value
    }))
  }, [])

  const handleAmountChange = useCallback((e) => {
    const value = e.target.value
    setNewTransaction(prev => ({
      ...prev,
      amount: value
    }))
  }, [])

  const handleDescriptionChange = useCallback((e) => {
    const value = e.target.value
    setNewTransaction(prev => ({
      ...prev,
      description: value
    }))
  }, [])

  const handleDateChange = useCallback((e) => {
    const value = e.target.value
    setNewTransaction(prev => ({
      ...prev,
      date: value
    }))
  }, [])

  const handleAddTransaction = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!newTransaction.category || !newTransaction.amount || !newTransaction.description) {
        alert('Proszę wypełnić wszystkie pola')
        setLoading(false)
        return
      }

      if (newTransaction.category === 'sprzedaz_plonow') {
        if (!newTransaction.productId || !newTransaction.quantity) {
          alert('Proszę wybrać produkt z magazynu i podać ilość')
          setLoading(false)
          return
        }

        const quantity = parseFloat(newTransaction.quantity)
        if (isNaN(quantity) || quantity <= 0) {
          alert('Proszę podać poprawną ilość')
          setLoading(false)
          return
        }

        if (selectedProduct && quantity > (selectedProduct.quantity || 0)) {
          alert(`Nie masz wystarczającej ilości w magazynie! Dostępne: ${formatNumber(selectedProduct.quantity)} ${selectedProduct.unit}`)
          setLoading(false)
          return
        }
      }

      if (newTransaction.category === 'sprzedaz_zwierzat') {
        if (!newTransaction.animalId) {
          alert('Proszę wybrać zwierzę do sprzedaży')
          setLoading(false)
          return
        }

        const amount = parseFloat(newTransaction.amount)
        if (isNaN(amount) || amount <= 0) {
          alert('Proszę podać poprawną cenę sprzedaży')
          setLoading(false)
          return
        }
      }

      if (newTransaction.category === 'sprzedaz_maszyn') {
        if (!newTransaction.machineId) {
          alert('Proszę wybrać maszynę do sprzedaży')
          setLoading(false)
          return
        }

        const amount = parseFloat(newTransaction.amount)
        if (isNaN(amount) || amount <= 0) {
          alert('Proszę podać poprawną cenę sprzedaży')
          setLoading(false)
          return
        }
      }

      const transactionData = {
        type: 'income',
        category: newTransaction.category,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        date: newTransaction.date
      }

      if (newTransaction.category === 'sprzedaz_plonow' && selectedProduct) {
        transactionData.productId = newTransaction.productId
        transactionData.quantity = parseFloat(newTransaction.quantity)
        transactionData.productName = selectedProduct.name
        transactionData.unit = selectedProduct.unit
        transactionData.source = 'warehouse'
        transactionData.unitPrice = selectedProduct.price || 0
      }

      if (newTransaction.category === 'sprzedaz_zwierzat' && selectedAnimal) {
        transactionData.animalId = newTransaction.animalId
        transactionData.animalName = selectedAnimal.name
        transactionData.earTag = selectedAnimal.earTag
        transactionData.animalType = selectedAnimal.type
        transactionData.source = 'animals'
      }

      if (newTransaction.category === 'sprzedaz_maszyn' && selectedMachine) {
        transactionData.machineId = newTransaction.machineId
        transactionData.machineName = selectedMachine.name
        transactionData.machineBrand = selectedMachine.brand
        transactionData.machineModel = selectedMachine.model
        transactionData.source = 'garage'
      }

      const result = await addTransaction(transactionData)

      if (result.success) {
        setShowAddForm(false)
        setNewTransaction({
          type: 'income',
          category: '',
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          productId: '',
          quantity: '',
          unit: '',
          animalId: ''
        })
        setSelectedProduct(null)
        setSelectedAnimal(null)
        setAvailableProducts([])
        setAnimalsData([])

        if (newTransaction.category === 'sprzedaz_plonow') {
          alert(`✅ Sprzedaż zarejestrowana! Sprzedano ${newTransaction.quantity} ${selectedProduct.unit} ${selectedProduct.name}`)
        } else if (newTransaction.category === 'sprzedaz_zwierzat') {
          alert(`✅ Sprzedaż zarejestrowana! Sprzedano ${selectedAnimal.name} za ${formatCurrency(newTransaction.amount)}`)
        } else if (newTransaction.category === 'sprzedaz_maszyn') {
          alert(`✅ Sprzedaż zarejestrowana! Sprzedano ${selectedMachine.name} za ${formatCurrency(newTransaction.amount)}`)
        } else {
          alert('✅ Przychód został dodany!')
        }
      } else {
        alert('Błąd przy dodawaniu transakcji: ' + result.error)
      }
    } catch (error) {
      console.error('Błąd:', error)
      alert('Wystąpił nieoczekiwany błąd: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCloseForm = useCallback(() => {
    if (!loading) {
      setShowAddForm(false);
      localStorage.removeItem('openIncomeForm');
      setNewTransaction({
        type: 'income',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        productId: '',
        quantity: '',
        unit: '',
        animalId: ''
      })
      setSelectedProduct(null)
      setSelectedAnimal(null)
      setAvailableProducts([])
      setAnimalsData([])
    }
  }, [loading])

  return (
    <div className="income-tab">
      {/* SELEKTOR OKRESU - NOWY UKŁAD */}
      <div className="income-period-selector">
        <div className="period-left-section">
          <div className="period-header">
            <h3>Przychody</h3>
            <p className="period-label">{getPeriodLabel()}</p>
          </div>

          <div className="period-buttons">
            {periodOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`period-button ${period === option.value ? 'active' : ''}`}
              >
                <span className="period-icon">{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="period-right-section">
          {/* SEKCJA SORTOWANIA I FILTROWANIA */}
          <div className="sort-filter-section">
            <label>Sortowanie i filtrowanie:</label>

            <select
              className="control-select"
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value)}
            >
              <option value="all">Wszystkie kategorie</option>
              {incomeCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              className="control-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
              disabled={loading}
            >
              + Dodaj przychód
            </button>
          </div>
        </div>
      </div>

      <div className="total-summary">
        Łączne przychody dla wybranego okresu: <strong>{formatCurrency(totalIncome)}</strong>
        {filterOption !== 'all' && (
          <span className="filter-info">
            (Filtr: {filterOptions.find(f => f.value === filterOption)?.label})
          </span>
        )}
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Dodaj nowy przychód</h4>
              <button
                className="close-btn"
                onClick={handleCloseForm}
                disabled={loading}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddTransaction}>
              <div className="form-group">
                <label>Kategoria *</label>
                <CustomSelect
                  options={categoryOptions}
                  value={newTransaction.category}
                  onChange={handleCategoryChange}
                  placeholder="Wybierz kategorię..."
                  searchable={true}
                  disabled={loading}
                />
              </div>

              {/* SEKCJA MAGAZYNOWA DLA SPRZEDAŻY PLONÓW */}
              {newTransaction.category === 'sprzedaz_plonow' && (
                <div className="warehouse-section">
                  <div className="section-header">
                    <span className="section-icon">📦</span>
                    <span className="section-title">Produkt z magazynu</span>
                  </div>

                  <div className="form-group">
                    <label>Wybierz produkt *</label>
                    <CustomSelect
                      options={productOptions}
                      value={newTransaction.productId}
                      onChange={handleProductChange}
                      placeholder="Wybierz produkt do sprzedaży..."
                      searchable={true}
                      disabled={loading || availableProducts.length === 0}
                    />
                    {availableProducts.length === 0 && (
                      <div className="form-hint warning">
                        ⚠️ Brak dostępnych produktów do sprzedaży w magazynie
                      </div>
                    )}
                  </div>

                  {selectedProduct && (
                    <>
                      <div className="product-info-card">
                        <div className="product-header">
                          <span className="product-icon">
                            {warehouseCategories.find(cat => cat.id === selectedProduct.category)?.icon || '📦'}
                          </span>
                          <div className="product-details">
                            <h5>{selectedProduct.name}</h5>
                            <div className="product-stats">
                              <span className="stat">
                                <strong>Dostępne:</strong> {formatNumber(selectedProduct.quantity)} {selectedProduct.unit}
                              </span>
                              <span className="stat">
                                <strong>Cena:</strong> {formatCurrency(selectedProduct.price || 0)}/{selectedProduct.unit}
                              </span>
                            </div>
                          </div>

                          {/* PODGLĄD ZAMÓWIENIA */}
                          {newTransaction.quantity && parseFloat(newTransaction.quantity) > 0 && (
                            <div className="order-preview-side">
                              <div className="preview-summary">
                                <div className="preview-row">
                                  <span className="label">Ilość:</span>
                                  <span className="value">
                                    {formatNumber(newTransaction.quantity)} {selectedProduct.unit}
                                  </span>
                                </div>
                                <div className="preview-row">
                                  <span className="label">Wartość:</span>
                                  <span className="value amount-positive">
                                    {formatCurrency((selectedProduct.price || 0) * parseFloat(newTransaction.quantity))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Ilość do sprzedaży ({selectedProduct.unit}) *</label>
                        <div className="quantity-input-group">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={selectedProduct.quantity}
                            value={newTransaction.quantity}
                            onChange={handleQuantityChange}
                            required
                            disabled={loading}
                            className="quantity-input"
                          />
                          <span className="quantity-unit">{selectedProduct.unit}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* SEKCJA ZWIERZĘTA DLA SPRZEDAŻY ZWIERZĄT */}
              {newTransaction.category === 'sprzedaz_zwierzat' && (
                <div className="warehouse-section">
                  <div className="section-header">
                    <span className="section-icon">🐄</span>
                    <span className="section-title">Wybierz zwierzę do sprzedaży</span>
                  </div>

                  <div className="form-group">
                    <label>Wybierz zwierzę *</label>
                    <CustomSelect
                      options={animalOptions}
                      value={newTransaction.animalId}
                      onChange={handleAnimalChange}
                      placeholder="Wybierz zwierzę do sprzedaży..."
                      searchable={true}
                      disabled={loading || animalsData.length === 0}
                    />
                    {animalsData.length === 0 && (
                      <div className="form-hint warning">
                        ⚠️ Brak dostępnych zwierząt do sprzedaży
                      </div>
                    )}
                  </div>

                  {selectedAnimal && (
                    <div className="product-info-card">
                      <div className="product-header">
                        <span className="product-icon">
                          {getAnimalIcon(selectedAnimal.type)}
                        </span>
                        <div className="product-details">
                          <h5>{selectedAnimal.name} ({selectedAnimal.earTag})</h5>
                          <div className="product-stats">
                            <span className="stat">
                              <strong>Typ:</strong> {selectedAnimal.type}
                            </span>
                            <span className="stat">
                              <strong>Rasa:</strong> {selectedAnimal.breed || 'Brak'}
                            </span>
                            <span className="stat">
                              <strong>Waga:</strong> {selectedAnimal.weight ? `${selectedAnimal.weight} kg` : 'Brak'}
                            </span>
                            <span className="stat">
                              <strong>Status:</strong> {selectedAnimal.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Cena sprzedaży (zł) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={newTransaction.amount}
                          onChange={handleAmountChange}
                          required
                          disabled={loading}
                          placeholder="Wprowadź cenę sprzedaży..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SEKCJA MASZYNY DLA SPRZEDAŻY MASZYN */}
              {newTransaction.category === 'sprzedaz_maszyn' && (
                <div className="warehouse-section">
                  <div className="section-header">
                    <span className="section-icon">🚜</span>
                    <span className="section-title">Wybierz maszynę do sprzedaży</span>
                  </div>

                  <div className="form-group">
                    <label>Wybierz maszynę *</label>
                    <CustomSelect
                      options={machineOptions}
                      value={newTransaction.machineId}
                      onChange={handleMachineChange}
                      placeholder="Wybierz maszynę do sprzedaży..."
                      searchable={true}
                      disabled={loading || loadingMachines || machinesData.length === 0}
                    />
                    {loadingMachines && (
                      <div className="form-hint">
                        <i className="fas fa-spinner fa-spin"></i> Ładowanie maszyn...
                      </div>
                    )}
                    {!loadingMachines && machinesData.length === 0 && (
                      <div className="form-hint warning">
                        ⚠️ Brak dostępnych maszyn do sprzedaży w garażu
                      </div>
                    )}
                  </div>

                  {selectedMachine && (
                    <div className="product-info-card">
                      <div className="product-header">
                        <span className="product-icon">
                          {getMachineIcon(selectedMachine.category)}
                        </span>
                        <div className="product-details">
                          <h5>{selectedMachine.name}</h5>
                          <div className="product-stats">
                            <span className="stat">
                              <strong>Marka/Model:</strong> {selectedMachine.brand || 'Brak'} {selectedMachine.model || ''}
                            </span>
                            <span className="stat">
                              <strong>Kategoria:</strong> {categoryOptions.find(opt => opt.value === selectedMachine.category)?.label || selectedMachine.category}
                            </span>
                            <span className="stat">
                              <strong>Rok:</strong> {selectedMachine.year || '?'}
                            </span>
                            <span className="stat">
                              <strong>Status:</strong> {translateMachineStatus(selectedMachine.status)}
                            </span>
                            {selectedMachine.purchasePrice > 0 && (
                              <span className="stat">
                                <strong>Cena zakupu:</strong> {formatCurrency(selectedMachine.purchasePrice)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Cena sprzedaży (zł) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={newTransaction.amount}
                          onChange={handleAmountChange}
                          required
                          disabled={loading}
                          placeholder="Wprowadź cenę sprzedaży..."
                        />
                        {selectedMachine.purchasePrice > 0 && (
                          <div className="form-hint info">
                            💡 Cena zakupu tej maszyny: {formatCurrency(selectedMachine.purchasePrice)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* KWOTA DLA INNYCH KATEGORII */}
              {newTransaction.category !== 'sprzedaz_plonow' && newTransaction.category !== 'sprzedaz_zwierzat' && newTransaction.category !== 'sprzedaz_maszyn' && (
                <div className="form-group">
                  <label>Kwota (zł) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={handleAmountChange}
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Opis *</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={handleDescriptionChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Data</label>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={handleDateChange}
                  disabled={loading}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseForm}
                  disabled={loading}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    'Przetwarzanie...'
                  ) : newTransaction.category === 'sprzedaz_plonow' ? (
                    'Zarejestruj sprzedaż'
                  ) : newTransaction.category === 'sprzedaz_zwierzat' ? (
                    'Sprzedaj zwierzę'
                  ) : (
                    'Dodaj przychód'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TABELA TRANSAKCJI */}
      <div className="transactions-table">
        {sortedTransactions.length === 0 ? (
          <div className="no-data-with-period">
            <p>Brak transakcji przychodowych dla wybranego okresu</p>
            <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
              Wybierz inny okres lub dodaj nową transakcję
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Kategoria</th>
                <th>Opis</th>
                <th>Kwota</th>
                <th>Szczegóły</th>
                <th>Typ</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map(transaction => {
                let categoryInfo = incomeCategories.find(cat => cat.id === transaction.category)
                if (!categoryInfo && transaction.warehouseCategory) {
                  categoryInfo = warehouseCategories.find(cat => cat.id === transaction.warehouseCategory)
                }

                return (
                  <tr key={transaction.id}>
                    <td>{getTransactionDate(transaction).toLocaleDateString('pl-PL')}</td>
                    <td>
                      <span className="category-with-icon">
                        <span className="icon" style={{ color: categoryInfo?.color }}>
                          {categoryInfo?.icon || '💰'}
                        </span>
                        <span style={{ textTransform: 'capitalize' }}>
                          {categoryInfo?.name || transaction.category}
                        </span>
                      </span>
                    </td>
                    <td>{transaction.description}</td>
                    <td className="amount positive">+{formatCurrency(transaction.amount)}</td>

                    {/* Kolumna Szczegóły */}
                    <td>
                      {transaction.productName ? (
                        <span className="product-badge">
                          {transaction.productName}
                          {transaction.quantity && ` (${transaction.quantity} ${transaction.unit})`}
                        </span>
                      ) : transaction.animalName ? (
                        <span className="animal-badge">
                          {transaction.animalName} ({transaction.earTag})
                        </span>
                      ) : transaction.machineName ? (
                        <div className="machine-details">
                          <span className="machine-badge">
                            {transaction.machineName}
                          </span>
                          {transaction.machineStatus && (
                            <span className="machine-status">
                              Status: {translateMachineStatus(transaction.machineStatus)}
                            </span>
                          )}
                        </div>
                      ) : '-'}
                    </td>

                    <td>
                      {transaction.source === 'warehouse' ? (
                        <span className="warehouse-badge">Magazyn</span>
                      ) : transaction.source === 'animals' ? (
                        <span className="animal-badge">Zwierzęta</span>
                      ) : transaction.autoGenerated ? (
                        <span className="auto-badge">Auto</span>
                      ) : (
                        <span className="manual-badge">Ręczne</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default React.memo(IncomeTab)