// hooks/useWarehouseFinanceIntegration.js
import { useFinance } from './useFinance'

export const useWarehouseFinanceIntegration = () => {
  const { addTransaction } = useFinance()

  const addWarehouseTransaction = async (productData, productId, action = 'add', categoryObj = null) => {
    try {
      const { name, quantity, price, unit } = productData
      const totalValue = (parseFloat(quantity) || 0) * (parseFloat(price) || 0)

      if (totalValue <= 0) return null

      // Użyj ID kategorii z magazynu jako kategorii w transakcji
      const categoryId = categoryObj?.id || productData.category || 'inne_koszty'

      // Dla kategorii magazynowych używamy istniejących ID z expenseCategories:
      // 'zboza', 'nawozy_nasiona', 'pasze', 'paliwo', 'sprzet_czesci'
      // Musimy mapować category.id z magazynu na category.id z finansów
      const categoryMap = {
        'zboza': 'zboza', // Magazyn 'zboza' → Finanse 'zboza'
        'nawozy': 'nawozy_nasiona', // Magazyn 'nawozy' → Finanse 'nawozy_nasiona'
        'pasze': 'pasze', // Magazyn 'pasze' → Finanse 'pasze'
        'paliwo': 'paliwo', // Magazyn 'paliwo' → Finanse 'paliwo'
        'narzedzia': 'sprzet_czesci' // Magazyn 'narzedzia' → Finanse 'sprzet_czesci'
      }

      const financeCategoryId = categoryMap[categoryId] || 'inne_koszty'

      // Przygotuj szczegóły w formacie: "Nazwa produktu (ilość jednostka) - cena"
      const details = `${name} (${quantity} ${unit}) - ${totalValue.toFixed(2)} zł`

      const transaction = await addTransaction({
        type: 'income', // Zawsze przychód przy dodawaniu do magazynu
        category: financeCategoryId, // Użyj ID kategorii z mapowania
        amount: totalValue,
        description: 'Dodana do magazynu', // Zgodnie z żądaniem
        details: details,

        // Pola strukturalne dla tabeli
        productName: name,
        quantity: parseFloat(quantity),
        unit: unit,
        unitPrice: parseFloat(price),

        date: new Date(),
        source: 'warehouse',
        warehouseProductId: productId,
        warehouseCategory: categoryId, // Oryginalne ID kategorii z magazynu
        isAutomatic: true
      })

      return transaction
    } catch (error) {
      console.error('Error adding warehouse transaction:', error)
      throw error
    }
  }

  const updateWarehouseTransaction = async (oldProduct, newProduct, productId) => {
    try {
      const oldQuantity = parseFloat(oldProduct.quantity) || 0
      const newQuantity = parseFloat(newProduct.quantity) || 0
      const quantityDifference = newQuantity - oldQuantity

      const oldValue = oldQuantity * (parseFloat(oldProduct.price) || 0)
      const newValue = newQuantity * (parseFloat(newProduct.price) || 0)
      const valueDifference = newValue - oldValue

      if (Math.abs(valueDifference) > 0.01) {
        // Mapowanie kategorii
        const categoryId = newProduct.category || 'inne_koszty'
        const categoryMap = {
          'zboza': 'zboza',
          'nawozy': 'nawozy_nasiona',
          'pasze': 'pasze',
          'paliwo': 'paliwo',
          'narzedzia': 'sprzet_czesci'
        }
        const financeCategoryId = categoryMap[categoryId] || 'inne_koszty'

        // Formatowanie różnicy ilości
        const quantityDiffSign = quantityDifference > 0 ? '+' : ''
        const quantityDiffStr = `${quantityDiffSign}${quantityDifference} ${newProduct.unit}`

        await addTransaction({
          type: valueDifference > 0 ? 'income' : 'expense',
          category: financeCategoryId,
          amount: Math.abs(valueDifference),
          description: `Korekta: ${newProduct.name}`,
          details: `Różnica: ${quantityDiffStr}`,

          // Pola strukturalne
          productName: newProduct.name,
          quantity: Math.abs(quantityDifference), // Zapisujemy różnicę jako ilość
          unit: newProduct.unit,
          unitPrice: parseFloat(newProduct.price),

          date: new Date(),
          source: 'warehouse',
          warehouseProductId: productId,
          warehouseCategory: categoryId,
          isAutomatic: true
        })
      }
    } catch (error) {
      console.error('Error updating warehouse transaction:', error)
    }
  }

  return {
    addWarehouseTransaction,
    updateWarehouseTransaction
  }
}