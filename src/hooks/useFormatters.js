// hooks/useFormatters.js
import { useCallback } from 'react'

export const useFormatters = () => {
  const formatCurrency = useCallback((amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0,00 zł'
    }
    
    const numAmount = parseFloat(amount)
    const formatted = numAmount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return `${formatted} zł`
  }, [])

  const formatNumber = useCallback((number) => {
    if (number === null || number === undefined || isNaN(number)) return '0'
    
    const num = parseFloat(number)
    
    if (num % 1 !== 0) {
      return num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    }
    
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }, [])

  const formatPercentage = useCallback((number) => {
    if (number === null || number === undefined || isNaN(number)) return '0%'
    
    const num = parseFloat(number)
    return num.toFixed(1).replace('.', ',') + '%'
  }, [])

  const formatDate = useCallback((date) => {
    if (!date) return ''
    
    let transactionDate
    try {
      if (date?.toDate) {
        transactionDate = date.toDate()
      } else if (date instanceof Date) {
        transactionDate = date
      } else {
        transactionDate = new Date(date)
      }
    } catch (error) {
      console.error('Błąd formatowania daty:', error)
      return 'Błąd daty'
    }

    return transactionDate.toLocaleDateString('pl-PL')
  }, [])

  return {
    formatCurrency,
    formatNumber,
    formatPercentage,
    formatDate
  }
}