// utils/chartUtils.js
export const generateMockFinancialData = (months = 12) => {
  // To tylko fallback - zostaw, ale nie będzie potrzebne z rzeczywistymi danymi
  return []
}

export const generateMockCostStructure = () => {
  return []
}

// GŁÓWNA FUNKCJA - przetwarzanie rzeczywistych transakcji na dane wykresu
export const prepareChartData = (transactions = []) => {
  if (!transactions || transactions.length === 0) {
    return []
  }

  // Grupowanie transakcji miesięcznie
  const monthlyData = {}
  
  transactions.forEach(transaction => {
    if (!transaction.date) return
    
    const date = transaction.date.toDate ? transaction.date.toDate() : new Date(transaction.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthName = date.toLocaleDateString('pl-PL', { month: 'short' })
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        name: monthName,
        fullDate: `${monthName} ${date.getFullYear()}`,
        revenue: 0,
        expenses: 0,
        transactionCount: 0
      }
    }
    
    const amount = parseFloat(transaction.amount) || 0
    
    if (transaction.type === 'income') {
      monthlyData[monthKey].revenue += amount
    } else if (transaction.type === 'expense') {
      monthlyData[monthKey].expenses += amount
    }
    
    monthlyData[monthKey].transactionCount++
  })

  // Sortowanie chronologicznie
  const sortedData = Object.values(monthlyData)
    .sort((a, b) => {
      const [aYear, aMonth] = Object.keys(monthlyData).find(key => monthlyData[key] === a)?.split('-') || []
      const [bYear, bMonth] = Object.keys(monthlyData).find(key => monthlyData[key] === b)?.split('-') || []
      return new Date(aYear, aMonth - 1) - new Date(bYear, bMonth - 1)
    })
    .slice(-12) // Ostatnie 12 miesięcy

  // Oblicz trend przychodów (średnia ruchoma 3-miesięczna)
  const dataWithTrend = sortedData.map((item, index, array) => {
    const trendWindow = 3
    let trend = item.revenue
    
    if (index >= trendWindow - 1) {
      const windowData = array.slice(index - trendWindow + 1, index + 1)
      trend = windowData.reduce((sum, d) => sum + d.revenue, 0) / trendWindow
    } else if (index > 0) {
      trend = (array[index - 1].revenue + item.revenue) / 2
    }
    
    return {
      ...item,
      revenue: parseFloat(item.revenue.toFixed(2)),
      expenses: parseFloat(item.expenses.toFixed(2)),
      revenueTrend: parseFloat(trend.toFixed(2)),
      balance: parseFloat((item.revenue - item.expenses).toFixed(2))
    }
  })

  return dataWithTrend
}

// Struktura kosztów z rzeczywistych transakcji
export const prepareCostStructure = (transactions = []) => {
  const expenses = transactions.filter(t => t.type === 'expense')
  
  if (expenses.length === 0) return []
  
  const categoryTotals = {}
  
  expenses.forEach(transaction => {
    const category = transaction.category || 'Inne'
    const amount = parseFloat(transaction.amount) || 0
    
    if (!categoryTotals[category]) {
      categoryTotals[category] = 0
    }
    
    categoryTotals[category] += amount
  })
  
  const totalExpenses = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)
  
  return Object.entries(categoryTotals)
    .map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      percentage: totalExpenses > 0 ? parseFloat(((value / totalExpenses) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.value - a.value)
}