// src/components/pages/MagazineStats.jsx
import './MagazinePage.css';

function MagazineStats({ items }) {
  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  
  const lowStockItems = items.filter(item => item.quantity <= item.minQuantity).length;
  
  const categoriesCount = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="magazine-stats">
      <div className="stat-card">
        <h3>Łączna ilość przedmiotów</h3>
        <p className="stat-number">{totalItems}</p>
      </div>
      
      <div className="stat-card">
        <h3>Wartość magazynu</h3>
        <p className="stat-number">{totalValue.toFixed(2)} zł</p>
      </div>
      
      <div className="stat-card warning">
        <h3>Niski stan</h3>
        <p className="stat-number">{lowStockItems}</p>
      </div>
      
      <div className="stat-card">
        <h3>Kategorie</h3>
        <p className="stat-number">{Object.keys(categoriesCount).length}</p>
      </div>
    </div>
  );
}

export default MagazineStats;