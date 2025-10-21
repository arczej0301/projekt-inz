// src/components/pages/MagazineList.jsx
import './MagazinePage.css';

function MagazineList({ items, onEdit, onDelete }) {
  if (items.length === 0) {
    return (
      <div className="magazine-list empty">
        <p>Brak przedmiotów w magazynie</p>
      </div>
    );
  }

  return (
    <div className="magazine-list">
      <div className="magazine-grid">
        {items.map(item => (
          <div key={item.id} className="magazine-item-card">
            <div className="item-header">
              <h3>{item.name}</h3>
              <span className={`quantity-badge ${item.quantity <= item.minQuantity ? 'low-stock' : ''}`}>
                {item.quantity} {item.unit}
              </span>
            </div>
            
            <div className="item-details">
              <p><strong>Kategoria:</strong> {item.category}</p>
              <p><strong>Lokalizacja:</strong> {item.location}</p>
              <p><strong>Minimalny stan:</strong> {item.minQuantity} {item.unit}</p>
              {item.expirationDate && (
                <p><strong>Data ważności:</strong> {new Date(item.expirationDate).toLocaleDateString()}</p>
              )}
              {item.price > 0 && (
                <p><strong>Cena:</strong> {item.price} zł</p>
              )}
            </div>

            {item.notes && (
              <div className="item-notes">
                <p>{item.notes}</p>
              </div>
            )}

            <div className="item-actions">
              <button onClick={() => onEdit(item)} className="btn-edit">
                Edytuj
              </button>
              <button onClick={() => onDelete(item.id)} className="btn-delete">
                Usuń
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MagazineList;