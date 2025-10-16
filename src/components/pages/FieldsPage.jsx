import React, { useState, useEffect, useRef } from 'react';
import { LoadScript, GoogleMap, DrawingManager, Polygon, InfoWindow } from '@react-google-maps/api';
import './FieldsPage.css';

const FieldsPage = () => { 
  const [fields, setFields] = useState([
    { 
      id: 1, 
      name: "Pole Północne", 
      area: 5.2, 
      soil: "gliniasta", 
      crop: "pszenica", 
      notes: "Pole o dobrej jakości glebie", 
      coordinates: [
        { lat: 52.23, lng: 21.01 }, 
        { lat: 52.24, lng: 21.02 }, 
        { lat: 52.23, lng: 21.03 }
      ] 
    },
    { 
      id: 2, 
      name: "Pole Południowe", 
      area: 3.8, 
      soil: "piaszczysta", 
      crop: "kukurydza", 
      notes: "Wymaga regularnego nawadniania", 
      coordinates: [
        { lat: 52.20, lng: 21.00 }, 
        { lat: 52.21, lng: 21.01 }, 
        { lat: 52.20, lng: 21.02 }
      ] 
    },
    { 
      id: 3, 
      name: "Pole Północne", 
      area: 5.2, 
      soil: "gliniasta", 
      crop: "pszenica", 
      notes: "Pole o dobrej jakości glebie", 
      coordinates: [
        { lat: 52.23, lng: 21.01 }, 
        { lat: 52.24, lng: 21.02 }, 
        { lat: 52.23, lng: 21.03 }
      ] 
    },
    { 
      id: 4, 
      name: "Pole Północne", 
      area: 5.2, 
      soil: "gliniasta", 
      crop: "pszenica", 
      notes: "Pole o dobrej jakości glebie", 
      coordinates: [
        { lat: 52.23, lng: 21.01 }, 
        { lat: 52.24, lng: 21.02 }, 
        { lat: 52.23, lng: 21.03 }
      ] 
    },
    { 
      id: 5, 
      name: "Pole Północne", 
      area: 5.2, 
      soil: "gliniasta", 
      crop: "pszenica", 
      notes: "Pole o dobrej jakości glebie", 
      coordinates: [
        { lat: 52.23, lng: 21.01 }, 
        { lat: 52.24, lng: 21.02 }, 
        { lat: 52.23, lng: 21.03 }
      ] 
    },
    { 
      id: 6, 
      name: "Pole Północne", 
      area: 5.2, 
      soil: "gliniasta", 
      crop: "pszenica", 
      notes: "Pole o dobrej jakości glebie", 
      coordinates: [
        { lat: 52.23, lng: 21.01 }, 
        { lat: 52.24, lng: 21.02 }, 
        { lat: 52.23, lng: 21.03 }
      ] 
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [drawingMode, setDrawingMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 52.2297, lng: 21.0122 });
  const [mapZoom, setMapZoom] = useState(10);

  const mapRef = useRef();
  const drawingManagerRef = useRef();

  const mapContainerStyle = {
    width: '100%',
    height: '100%'
  };

  const mapOptions = {
    mapTypeId: 'hybrid',
    streetViewControl: false
  };

  const polygonOptions = {
    fillColor: '#27ae60',
    fillOpacity: 0.35,
    strokeColor: '#219653',
    strokeOpacity: 0.8,
    strokeWeight: 2
  };

  const drawingManagerOptions = {
    drawingControl: true,
    drawingControlOptions: {
      position: window.google?.maps.ControlPosition.TOP_CENTER,
      drawingModes: [window.google?.maps.drawing.OverlayType.POLYGON]
    },
    polygonOptions: {
      fillColor: '#27ae60',
      fillOpacity: 0.3,
      strokeWeight: 2,
      strokeColor: '#219653',
      editable: true,
      draggable: false
    }
  };

  // Inicjalizacja mapy
  const onMapLoad = (map) => {
    mapRef.current = map;
  };

  // Obsługa narysowanego kształtu
  const onPolygonComplete = (polygon) => {
    if (!window.google) return;

    const coordinates = polygon.getPath().getArray().map(latLng => ({
      lat: latLng.lat(),
      lng: latLng.lng()
    }));

    const area = (window.google.maps.geometry.spherical.computeArea(polygon.getPath()) / 10000).toFixed(2);

    setCurrentField({
      id: Date.now(),
      name: '',
      area: parseFloat(area),
      soil: '',
      crop: '',
      notes: '',
      coordinates: coordinates
    });

    setDrawingMode(false);
    setIsModalOpen(true);
    
    // Usuń polygon po narysowaniu
    polygon.setMap(null);
  };

  // Otwieranie modala
  const openFieldModal = (field = null) => {
    if (field) {
      setCurrentField(field);
    } else {
      setCurrentField({
        id: Date.now(),
        name: '',
        area: '',
        soil: '',
        crop: '',
        notes: '',
        coordinates: []
      });
    }
    setIsModalOpen(true);
  };

  // Zamykanie modala
  const closeFieldModal = () => {
    setIsModalOpen(false);
    setCurrentField(null);
  };

  // Zapis pola
  const saveField = () => {
    if (!currentField?.name || !currentField?.area || !currentField?.soil) {
      alert('Proszę wypełnić wszystkie wymagane pola!');
      return;
    }

    if (fields.find(f => f.id === currentField.id)) {
      // Edycja istniejącego pola
      setFields(fields.map(f => f.id === currentField.id ? currentField : f));
    } else {
      // Dodanie nowego pola
      setFields([...fields, currentField]);
    }

    closeFieldModal();
  };

  // Edycja pola
  const editField = (id) => {
    const field = fields.find(f => f.id === id);
    if (field) {
      openFieldModal(field);
    }
  };

  // Usuwanie pola
  const deleteField = (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć to pole?')) {
      setFields(fields.filter(f => f.id !== id));
      setSelectedField(null);
    }
  };

  // Kliknięcie na pole na mapie
  const onFieldClick = (field) => {
    setSelectedField(field);
  };

  // Filtrowanie pól
  const filteredFields = fields.filter(field =>
    field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.soil.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (field.crop && field.crop.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container">
      
      {/* Główna zawartość */}
      <div className="main-content">
        <div className="header">
          <h2>Zarządzanie polami</h2>
          
        </div>
        
        <div className="content">
          <div className="actions-bar">
            <div>
              <button className="btn btn-primary" onClick={() => openFieldModal()}>
                <i className="fas fa-plus"></i> Dodaj pole
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setDrawingMode(!drawingMode)}
              >
                <i className="fas fa-draw-polygon"></i> 
                {drawingMode ? 'Anuluj rysowanie' : 'Narysuj pole'}
              </button>
            </div>
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input 
                type="text" 
                placeholder="Szukaj pola..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Mapa */}
          <div className="map-container">
            <LoadScript 
              googleMapsApiKey="AIzaSyDwQY25si9n-D7toIcLHKh32Ejq8l2KcFA"
              libraries={['drawing', 'geometry']}
            >
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={mapZoom}
                options={mapOptions}
                onLoad={onMapLoad}
              >
                {/* Manager rysowania */}
                {drawingMode && (
                  <DrawingManager
                    onPolygonComplete={onPolygonComplete}
                    options={drawingManagerOptions}
                  />
                )}
                
                {/* Wyświetlanie istniejących pól */}
                {fields.map(field => (
                  <Polygon
                    key={field.id}
                    paths={field.coordinates}
                    options={polygonOptions}
                    onClick={() => onFieldClick(field)}
                  />
                ))}
                
                {/* InfoWindow dla wybranego pola */}
                {selectedField && (
                  <InfoWindow
                    position={selectedField.coordinates[0]}
                    onCloseClick={() => setSelectedField(null)}
                  >
                    <div>
                      <h3>{selectedField.name}</h3>
                      <p>Powierzchnia: {selectedField.area} ha</p>
                      <p>Gleba: {selectedField.soil}</p>
                      <p>Uprawa: {selectedField.crop || 'Brak'}</p>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </LoadScript>
          </div>
          
          {/* Lista pól */}
          <div className="fields-list">
            <h3>Lista pól</h3>
            <table className="fields-table">
              <thead>
                <tr>
                  <th>Nazwa</th>
                  <th>Powierzchnia (ha)</th>
                  <th>Typ gleby</th>
                  <th>Uprawa</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {filteredFields.map(field => (
                  <tr key={field.id}>
                    <td>{field.name}</td>
                    <td>{field.area}</td>
                    <td>{field.soil}</td>
                    <td>{field.crop || 'Brak'}</td>
                    <td className="action-buttons">
                      <button 
                        className="action-btn btn-primary" 
                        onClick={() => editField(field.id)}
                      >
                        <i className="fas fa-edit"></i> Edytuj
                      </button>
                      <button 
                        className="action-btn btn-danger" 
                        onClick={() => deleteField(field.id)}
                      >
                        <i className="fas fa-trash"></i> Usuń
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Modal */}
      {isModalOpen && currentField && (
        <FieldModal
          field={currentField}
          onFieldChange={setCurrentField}
          onSave={saveField}
          onClose={closeFieldModal}
        />
      )}
    </div>
  );
};

// Komponent modala
const FieldModal = ({ field, onFieldChange, onSave, onClose }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFieldChange({
      ...field,
      [name]: name === 'area' ? parseFloat(value) || '' : value
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{field.id && fields.find(f => f.id === field.id) ? 'Edytuj pole' : 'Dodaj nowe pole'}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
            <div className="form-group">
              <label htmlFor="fieldName">Nazwa pola</label>
              <input
                type="text"
                id="fieldName"
                name="name"
                value={field.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="fieldArea">Powierzchnia (ha)</label>
              <input
                type="number"
                id="fieldArea"
                name="area"
                value={field.area}
                onChange={handleInputChange}
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="fieldSoil">Typ gleby</label>
              <select
                id="fieldSoil"
                name="soil"
                value={field.soil}
                onChange={handleInputChange}
                required
              >
                <option value="">Wybierz typ gleby</option>
                <option value="gliniasta">Gliniasta</option>
                <option value="piaszczysta">Piaszczysta</option>
                <option value="ilasta">Ilasta</option>
                <option value="torfowa">Torfowa</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="fieldCrop">Aktualna uprawa</label>
              <select
                id="fieldCrop"
                name="crop"
                value={field.crop || ''}
                onChange={handleInputChange}
              >
                <option value="">Brak uprawy</option>
                <option value="pszenica">Pszenica</option>
                <option value="kukurydza">Kukurydza</option>
                <option value="rzepak">Rzepak</option>
                <option value="ziemniaki">Ziemniaki</option>
                <option value="buraki">Buraki cukrowe</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="fieldNotes">Notatki</label>
              <textarea
                id="fieldNotes"
                name="notes"
                value={field.notes || ''}
                onChange={handleInputChange}
                rows="3"
              />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Anuluj
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            Zapisz pole
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldsPage;