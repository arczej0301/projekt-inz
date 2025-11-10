import React, { useState, useEffect, useRef } from 'react';
import { LoadScript, GoogleMap, Polygon, InfoWindow, Marker } from '@react-google-maps/api';
import { 
  getFields, 
  addField, 
  updateField, 
  deleteField,
  subscribeToFields,
  // DODANE FUNKCJE DLA STATUSÓW
  getFieldStatus,
  updateFieldStatus,
  addFieldStatus
} from '../../services/fieldsService';
import './FieldsPage.css';

const FieldsPage = () => { 
  const [fields, setFields] = useState([]);
  const [fieldStatuses, setFieldStatuses] = useState({}); // { fieldId: statusData }
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false); // NOWY MODAL
  const [currentField, setCurrentField] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null); // NOWY STAN
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempPolygon, setTempPolygon] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [hoveredField, setHoveredField] = useState(null);

  // NOWE STANY DLA SORTOWANIA
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });

  // Lokalizacja gospodarstwa: 53°12'46.9"N 22°09'42.6"E
  const [mapCenter] = useState({ lat: 53.29684935063282, lng: 21.431474045415577 });
  const [mapZoom] = useState(17);

  const mapRef = useRef();
  const googleRef = useRef();

  const mapContainerStyle = {
    width: '100%',
    height: '900px'
  };

  const mapOptions = {
    mapTypeId: 'hybrid',
    streetViewControl: false,
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    rotateControl: true,
    fullscreenControl: true,
    draggableCursor: isDrawing ? 'crosshair' : 'default'
  };

  const polygonOptions = {
    fillColor: '#27ae60',
    fillOpacity: 0.35,
    strokeColor: '#219653',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    clickable: true,
    draggable: false,
    editable: false,
    zIndex: 1
  };

  const selectedPolygonOptions = {
    fillColor: '#e74c3c',
    fillOpacity: 0.5,
    strokeColor: '#c0392b',
    strokeOpacity: 0.9,
    strokeWeight: 3,
    clickable: true,
    draggable: false,
    editable: false,
    zIndex: 3
  };

  const tempPolygonOptions = {
    fillColor: '#3498db',
    fillOpacity: 0.3,
    strokeColor: '#2980b9',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    clickable: false,
    draggable: false,
    editable: false,
    zIndex: 2
  };

  const markerOptions = {
    icon: {
      path: window.google?.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#e74c3c',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    }
  };

   // Funkcja do sortowania pól
  const sortFields = (fieldsToSort) => {
    if (!sortConfig.key) return fieldsToSort;

    return [...fieldsToSort].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Specjalna obsługa dla statusu (pobieramy z fieldStatuses)
      if (sortConfig.key === 'status') {
        aValue = getStatusDisplay(a.id);
        bValue = getStatusDisplay(b.id);
      }

      // Dla wartości tekstowych
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Dla wartości liczbowych
      if (sortConfig.key === 'area') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Funkcja do zmiany sortowania
  const handleSort = (key) => {
    let direction = 'asc';
    
    // Jeśli klikamy ten sam klucz, zmieniamy kierunek
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // POPRAWIONA FUNKCJA: Renderowanie strzałek sortowania
  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) {
      return (
        <span className="sort-arrows" style={{ marginLeft: '8px', fontSize: '14px' }}>
          <i className="fas fa-sort" style={{ color: '#95a5a6' }}></i>
        </span>
      );
    }

    return (
      <span className="sort-arrows" style={{ marginLeft: '8px', fontSize: '16px' }}>
        {sortConfig.direction === 'asc' ? (
          <i className="fas fa-sort-up" style={{ color: '#e74c3c', fontWeight: 'bold' }}></i>
        ) : (
          <i className="fas fa-sort-down" style={{ color: '#e74c3c', fontWeight: 'bold' }}></i>
        )}
      </span>
    );
  };

  // Pobierz pola i ich statusy z Firebase - POPRAWIONA WERSJA
  useEffect(() => {
    const loadFieldsAndStatuses = async () => {
      try {
        setLoading(true);
        const fieldsData = await getFields();
        setFields(fieldsData);

        // Pobierz statusy dla każdego pola osobno
        const statuses = {};
        for (const field of fieldsData) {
          try {
            const status = await getFieldStatus(field.id);
            if (status) {
              statuses[field.id] = status;
            }
          } catch (statusError) {
            console.error(`Error loading status for field ${field.id}:`, statusError);
            // Kontynuuj ładowanie innych pól nawet jeśli jeden status się nie udał
          }
        }
        setFieldStatuses(statuses);
      } catch (error) {
        console.error('Error loading fields:', error);
        alert('Błąd podczas ładowania pól: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    loadFieldsAndStatuses();

    const unsubscribe = subscribeToFields(async (fieldsData) => {
      setFields(fieldsData);
      
      // Aktualizuj statusy dla załadowanych pól
      const statuses = {};
      for (const field of fieldsData) {
        try {
          const status = await getFieldStatus(field.id);
          if (status) {
            statuses[field.id] = status;
          }
        } catch (statusError) {
          console.error(`Error loading status for field ${field.id}:`, statusError);
        }
      }
      setFieldStatuses(statuses);
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Aktualizuj kursor mapy gdy zmienia się tryb rysowania
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setOptions({
        draggableCursor: isDrawing ? 'crosshair' : 'default'
      });
    }
  }, [isDrawing]);

  // Funkcja do obliczania centroidu polygonu
  const calculateCentroid = (coordinates) => {
    if (!coordinates || coordinates.length === 0) return null;
    
    // Usuń ostatni punkt jeśli jest duplikatem pierwszego (zamknięty polygon)
    const points = coordinates[0].lat === coordinates[coordinates.length - 1].lat && 
                   coordinates[0].lng === coordinates[coordinates.length - 1].lng 
                   ? coordinates.slice(0, -1) 
                   : coordinates;

    if (points.length === 0) return null;

    let signedArea = 0;
    let centroidX = 0;
    let centroidY = 0;

    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      
      const area = (current.lat * next.lng) - (next.lat * current.lng);
      signedArea += area;
      centroidX += (current.lat + next.lat) * area;
      centroidY += (current.lng + next.lng) * area;
    }

    signedArea *= 0.5;
    centroidX /= (6 * signedArea);
    centroidY /= (6 * signedArea);

    return { lat: centroidX, lng: centroidY };
  };

  // Oblicz odległość między punktami w metrach
  const calculateDistance = (point1, point2) => {
    if (!googleRef.current || !googleRef.current.maps) return Infinity;
    
    try {
      const latLng1 = new googleRef.current.maps.LatLng(point1.lat, point1.lng);
      const latLng2 = new googleRef.current.maps.LatLng(point2.lat, point2.lng);
      
      return googleRef.current.maps.geometry.spherical.computeDistanceBetween(latLng1, latLng2);
    } catch (error) {
      console.error('Error calculating distance:', error);
      return Infinity;
    }
  };

  // Dokładna funkcja do obliczania powierzchni
  const calculateAreaAccurate = (coordinates) => {
    if (coordinates.length < 3) return 0;
    
    let total = 0;
    const n = coordinates.length;
    
    for (let i = 0; i < n - 1; i++) {
      const lat1 = coordinates[i].lat * Math.PI / 180;
      const lng1 = coordinates[i].lng * Math.PI / 180;
      const lat2 = coordinates[i + 1].lat * Math.PI / 180;
      const lng2 = coordinates[i + 1].lng * Math.PI / 180;
      
      total += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    
    total = Math.abs(total);
    const earthRadius = 6371000; // promień Ziemi w metrach
    const areaM2 = total * earthRadius * earthRadius / 2;
    
    return (areaM2 / 10000).toFixed(2); // hektary
  };

  // Kliknięcie na mapę podczas rysowania
  const onMapClick = (event) => {
    if (!isDrawing) return;

    const newPoint = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };

    // Sprawdź czy kliknięto w pobliżu pierwszego punktu (zamykanie polygonu)
    if (tempPolygon.length >= 3) {
      const firstPoint = tempPolygon[0];
      const distance = calculateDistance(firstPoint, newPoint);
      
      // Jeśli kliknięto w pobliżu pierwszego punktu (w promieniu 20m) - zakończ rysowanie
      if (distance < 20) {
        finishDrawing();
        return;
      }
    }

    setTempPolygon(prev => [...prev, newPoint]);
  };

  // Zakończ rysowanie i oblicz powierzchnię
  const finishDrawing = () => {
    if (tempPolygon.length < 3) {
      alert('Potrzebujesz co najmniej 3 punkty do utworzenia polygonu!');
      return;
    }

    // Zamknij polygon (dodaj pierwszy punkt na koniec)
    const closedPolygon = [...tempPolygon, tempPolygon[0]];
    
    // Oblicz powierzchnię
    let areaHa = 0;
    if (googleRef.current && googleRef.current.maps) {
      try {
        const areaM2 = googleRef.current.maps.geometry.spherical.computeArea(
          closedPolygon.map(coord => new googleRef.current.maps.LatLng(coord.lat, coord.lng))
        );
        areaHa = (areaM2 / 10000).toFixed(2);
      } catch (error) {
        console.error('Error calculating area with Google API:', error);
        areaHa = calculateAreaAccurate(closedPolygon);
      }
    } else {
      areaHa = calculateAreaAccurate(closedPolygon);
    }

    setCurrentField({
      name: '',
      area: parseFloat(areaHa),
      soil: '',
      crop: '',
      notes: '',
      coordinates: closedPolygon
    });

    setIsDrawing(false);
    setTempPolygon([]);
    setIsModalOpen(true);
  };

  // Anuluj rysowanie
  const cancelDrawing = () => {
    setIsDrawing(false);
    setTempPolygon([]);
  };

  // Rozpocznij rysowanie
  const startDrawing = () => {
    setIsDrawing(true);
    setTempPolygon([]);
    setSelectedField(null);
  };

  // Otwieranie modala
  const openFieldModal = (field = null) => {
    if (field) {
      setCurrentField(field);
    } else {
      setCurrentField({
        name: '',
        area: '',
        soil: '',
        crop: '',
        notes: '',
        coordinates: []
      });
    }
    setIsModalOpen(true);
    cancelDrawing();
  };

  // Zamykanie modala
  const closeFieldModal = () => {
    setIsModalOpen(false);
    setCurrentField(null);
    setSaveLoading(false);
  };

  // NOWA FUNKCJA: Otwórz modal statusu
  const openStatusModal = (field = null) => {
    if (field) {
      setCurrentField(field);
      // Załaduj istniejący status lub utwórz nowy
      const existingStatus = fieldStatuses[field.id];
      setCurrentStatus(existingStatus || {
        field_id: field.id,
        status: '',
        crop: field.crop || '',
        notes: '',
        date_created: new Date().toISOString()
      });
    } else {
      setCurrentField(null);
      setCurrentStatus({
        field_id: '',
        status: '',
        crop: '',
        notes: '',
        date_created: new Date().toISOString()
      });
    }
    setIsStatusModalOpen(true);
  };

  // NOWA FUNKCJA: Zamknij modal statusu
  const closeStatusModal = () => {
    setIsStatusModalOpen(false);
    setCurrentField(null);
    setCurrentStatus(null);
    setSaveLoading(false);
  };

  // Zapis pola do Firebase
  const saveField = async () => {
    if (!currentField?.name || !currentField?.area || !currentField?.soil) {
      alert('Proszę wypełnić wszystkie wymagane pola!');
      return;
    }

    try {
      setSaveLoading(true);
      
      const fieldData = {
        name: currentField.name.trim(),
        area: parseFloat(currentField.area),
        soil: currentField.soil,
        crop: currentField.crop || '',
        notes: currentField.notes || '',
        coordinates: currentField.coordinates
      };

      if (currentField.id) {
        await updateField(currentField.id, fieldData);
      } else {
        await addField(fieldData);
      }
      
      closeFieldModal();
    } catch (error) {
      console.error('Error saving field:', error);
      alert('Błąd podczas zapisywania pola: ' + error.message);
      setSaveLoading(false);
    }
  };

  // NOWA FUNKCJA: Zapisz status pola
  const saveFieldStatus = async () => {
    if (!currentStatus?.status) {
      alert('Proszę wybrać stan pola!');
      return;
    }

    try {
      setSaveLoading(true);
      
      if (currentStatus.id) {
        await updateFieldStatus(currentStatus.id, currentStatus);
      } else {
        await addFieldStatus(currentStatus);
      }
      
      // Aktualizuj lokalny stan
      setFieldStatuses(prev => ({
        ...prev,
        [currentStatus.field_id]: currentStatus
      }));
      
      closeStatusModal();
    } catch (error) {
      console.error('Error saving field status:', error);
      alert('Błąd podczas zapisywania stanu pola: ' + error.message);
      setSaveLoading(false);
    }
  };

  // Edycja pola
  const editField = (id) => {
    const field = fields.find(f => f.id === id);
    if (field) {
      openFieldModal(field);
    }
  };

  // Usuwanie pola
  const handleDeleteField = async (id) => {
    if (!window.confirm('Czy na pewno chcesz usunąć to pole?')) {
      return;
    }

    try {
      await deleteField(id);
      if (selectedField?.id === id) {
        setSelectedField(null);
      }
    } catch (error) {
      console.error('Error deleting field:', error);
      alert('Błąd podczas usuwania pola: ' + error.message);
    }
  };

  // Kliknięcie na pole na mapie
  const onFieldClick = (field) => {
    if (!isDrawing) {
      setSelectedField(field);
    }
  };

  // Wybierz pole z listy
  const selectFieldFromList = (field) => {
    setSelectedField(field);
    
    // Przesuń mapę do wybranego pola
    if (field.coordinates && field.coordinates.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      field.coordinates.forEach(coord => {
        bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
      });
      
      if (mapRef.current) {
        mapRef.current.fitBounds(bounds);
        mapRef.current.panToBounds(bounds, 50);
      }
    }
  };

  // Najedź na pole w liście
  const hoverFieldFromList = (field) => {
    setHoveredField(field);
  };

  // Zdejmij hover z pola
  const leaveFieldFromList = () => {
    setHoveredField(null);
  };

   // Funkcja pomocnicza do wyświetlania statusu
  const getStatusDisplay = (fieldId) => {
    const status = fieldStatuses[fieldId];
    if (!status || !status.status) return 'Brak danych';
    
    const statusLabels = {
      'sown': 'Zasiane',
      'harvested': 'Zebrane',
      'ready_for_sowing': 'Przygotowane do siewu',
      'fallow': 'Ugór',
      'pasture': 'Pastwisko/Łąka'
    };
    
    return statusLabels[status.status] || status.status;
  };

  // Funkcja pomocnicza do kolorowania statusu
  const getStatusColor = (fieldId) => {
    const status = fieldStatuses[fieldId];
    if (!status || !status.status) return '#95a5a6';
    
    const statusColors = {
      'sown': '#27ae60',
      'harvested': '#e74c3c',
      'ready_for_sowing': '#3498db',
      'fallow': '#f39c12',
      'pasture': '#2ecc71'
    };
    
    return statusColors[status.status] || '#95a5a6';
  };

  // Filtrowanie i sortowanie pól
  const filteredFields = fields.filter(field =>
    field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.soil.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (field.crop && field.crop.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedAndFilteredFields = sortFields(filteredFields);

  
  return (
      <div className="fields-page">
        <div className="header">
          <h2>Zarządzanie polami</h2>
        </div>
        
        <div className="content">
          <div className="actions-bar">
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={() => openFieldModal()}>
                <i className="fas fa-plus"></i> Dodaj pole
              </button>
              <button 
                className="btn btn-info"
                onClick={() => openStatusModal()}
              >
                <i className="fas fa-seedling"></i> Zarządzaj stanem pól
              </button>
              <button 
                className={`btn ${isDrawing ? 'btn-danger' : 'btn-secondary'}`}
                onClick={isDrawing ? cancelDrawing : startDrawing}
              >
                <i className="fas fa-draw-polygon"></i> 
                {isDrawing ? 'Anuluj rysowanie' : 'Narysuj pole'}
              </button>
              {isDrawing && tempPolygon.length >= 3 && (
                <button 
                  className="btn btn-success"
                  onClick={finishDrawing}
                >
                  <i className="fas fa-check"></i> Zakończ rysowanie
                </button>
              )}
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
          <div className={`map-container ${isDrawing ? 'drawing-active' : ''}`}>
            
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={mapZoom}
                options={mapOptions}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
                onClick={onMapClick}
              >
                {/* Tymczasowy polygon podczas rysowania */}
                {isDrawing && tempPolygon.length > 0 && (
                  <>
                    <Polygon
                      paths={tempPolygon}
                      options={tempPolygonOptions}
                    />
                    {/* Znaczniki punktów */}
                    {tempPolygon.map((point, index) => (
                      <Marker
                        key={index}
                        position={point}
                        label={{
                          text: (index + 1).toString(),
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                        icon={{
                          path: window.google?.maps.SymbolPath.CIRCLE,
                          scale: 8,
                          fillColor: index === 0 ? '#e74c3c' : '#3498db',
                          fillOpacity: 1,
                          strokeColor: '#ffffff',
                          strokeWeight: 2,
                        }}
                      />
                    ))}
                  </>
                )}
                
                {/* Wyświetlanie istniejących pól */}
                {fields.map(field => (
                  <Polygon
                    key={field.id}
                    paths={field.coordinates}
                    options={
                      selectedField?.id === field.id 
                        ? selectedPolygonOptions 
                        : {
                            ...polygonOptions,
                            fillColor: hoveredField?.id === field.id ? '#f39c12' : '#27ae60'
                          }
                    }
                    onClick={() => onFieldClick(field)}
                    onMouseOver={() => setHoveredField(field)}
                    onMouseOut={() => setHoveredField(null)}
                  />
                ))}
                
                {/* InfoWindow dla wybranego pola */}
                {selectedField && (
                  <InfoWindow
                    position={calculateCentroid(selectedField.coordinates) || 
                             (selectedField.coordinates && selectedField.coordinates[0]) || 
                             mapCenter}
                    onCloseClick={() => setSelectedField(null)}
                    options={{
                      pixelOffset: new window.google.maps.Size(0, -40),
                      maxWidth: 300
                    }}
                  >
                    <div className="field-info-window">
                      <h3>{selectedField.name}</h3>
                      <div className="field-info-details">
                        <p>
                          <i className="fas fa-ruler-combined"></i> 
                          <strong>Powierzchnia:</strong> {selectedField.area} ha
                        </p>
                        <p>
                          <i className="fas fa-mountain"></i> 
                          <strong>Gleba:</strong> {selectedField.soil}
                        </p>
                        <p>
                          <i className="fas fa-seedling"></i> 
                          <strong>Uprawa:</strong> {selectedField.crop || 'Brak'}
                        </p>
                        <p>
                          <i className="fas fa-chart-line"></i> 
                          <strong>Stan:</strong> {getStatusDisplay(selectedField.id)}
                        </p>
                        {selectedField.notes && (
                          <p>
                            <i className="fas fa-sticky-note"></i> 
                            <strong>Notatki:</strong> {selectedField.notes}
                          </p>
                        )}
                      </div>
                      <div className="field-info-actions">
                        <button 
                          className="action-btn btn-primary"
                          onClick={() => editField(selectedField.id)}
                        >
                          <i className="fas fa-edit"></i> Edytuj
                        </button>
                        <button 
                          className="action-btn btn-info"
                          onClick={() => openStatusModal(selectedField)}
                        >
                          <i className="fas fa-seedling"></i> Stan
                        </button>
                        <button 
                          className="action-btn btn-danger"
                          onClick={() => handleDeleteField(selectedField.id)}
                        >
                          <i className="fas fa-trash"></i> Usuń
                        </button>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            
            {/* Instrukcja rysowania */}
            {isDrawing && (
              <div className="drawing-instruction">
                <div className="instruction-content">
                  <i className="fas fa-info-circle"></i>
                  <div>
                    <div><strong>Instrukcja rysowania:</strong></div>
                    <div>Kliknij na mapę, aby dodać punkty polygonu</div>
                    <div>Minimalnie 3 punkty - aktualnie: {tempPolygon.length}</div>
                    {tempPolygon.length >= 3 && (
                      <div style={{ color: '#27ae60', fontWeight: 'bold' }}>
                        Kliknij w pobliżu pierwszego punktu, aby zamknąć polygon
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
           {/* Lista pól - ZAKTUALIZOWANA Z SORTOWANIEM */}
          <div className="fields-list">
            <h3>Lista pól ({sortedAndFilteredFields.length})</h3>
            {sortedAndFilteredFields.length === 0 ? (
              <div className="no-fields">
                <p>Brak pól do wyświetlenia</p>
              </div>
            ) : (
              <table className="fields-table">
                <thead>
                  <tr>
                    <th 
                      className="sortable" 
                      onClick={() => handleSort('name')}
                    >
                      <div className="th-content">
                        Nazwa
                        {renderSortArrow('name')}
                      </div>
                    </th>
                    <th 
                      className="sortable" 
                      onClick={() => handleSort('area')}
                    >
                      <div className="th-content">
                        Powierzchnia (ha)
                        {renderSortArrow('area')}
                      </div>
                    </th>
                    <th 
                      className="sortable" 
                      onClick={() => handleSort('soil')}
                    >
                      <div className="th-content">
                        Typ gleby
                        {renderSortArrow('soil')}
                      </div>
                    </th>
                    <th 
                      className="sortable" 
                      onClick={() => handleSort('crop')}
                    >
                      <div className="th-content">
                        Uprawa
                        {renderSortArrow('crop')}
                      </div>
                    </th>
                    <th 
                      className="sortable" 
                      onClick={() => handleSort('status')}
                    >
                      <div className="th-content">
                        Stan
                        {renderSortArrow('status')}
                      </div>
                    </th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAndFilteredFields.map(field => (
                    <tr 
                      key={field.id}
                      className={`field-row ${
                        selectedField?.id === field.id ? 'selected' : ''
                      } ${
                        hoveredField?.id === field.id ? 'hovered' : ''
                      }`}
                      onClick={() => selectFieldFromList(field)}
                      onMouseEnter={() => hoverFieldFromList(field)}
                      onMouseLeave={leaveFieldFromList}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <strong>{field.name}</strong>
                        {selectedField?.id === field.id && (
                          <span style={{ color: '#e74c3c', marginLeft: '8px' }}>
                            <i className="fas fa-map-marker-alt"></i> Zaznaczone
                          </span>
                        )}
                      </td>
                      <td>{field.area}</td>
                      <td>{field.soil}</td>
                      <td>{field.crop || 'Brak'}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{
                            backgroundColor: getStatusColor(field.id),
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openStatusModal(field);
                          }}
                        >
                          {getStatusDisplay(field.id)}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <button 
                          className="action-btn btn-primary" 
                          onClick={(e) => {
                            e.stopPropagation();
                            editField(field.id);
                          }}
                        >
                          <i className="fas fa-edit"></i> Edytuj
                        </button>
                        <button 
                          className="action-btn btn-info" 
                          onClick={(e) => {
                            e.stopPropagation();
                            openStatusModal(field);
                          }}
                        >
                          <i className="fas fa-seedling"></i> Stan
                        </button>
                        <button 
                          className="action-btn btn-danger" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteField(field.id);
                          }}
                        >
                          <i className="fas fa-trash"></i> Usuń
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      
      {/* Modal dodawania/edycji pola */}
      {isModalOpen && currentField && (
        <FieldModal
          field={currentField}
          onFieldChange={setCurrentField}
          onSave={saveField}
          onClose={closeFieldModal}
          saveLoading={saveLoading}
        />
      )}

      {/* Modal statusu pola */}
      {isStatusModalOpen && currentStatus && (
        <FieldStatusModal
          field={currentField}
          status={currentStatus}
          onStatusChange={setCurrentStatus}
          onSave={saveFieldStatus}
          onClose={closeStatusModal}
          saveLoading={saveLoading}
        />
      )}
    </div>
  );
};


// Komponent modala (POPRAWIONA WERSJA)
const FieldModal = ({ field, onFieldChange, onSave, onClose, saveLoading }) => {
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isSoilOpen, setIsSoilOpen] = useState(false);

  // POPRAWIONE: Funkcja do obsługi zmian w formularzu
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (typeof onFieldChange === 'function') {
      onFieldChange(prev => ({
        ...prev,
        [name]: name === 'area' ? (value === '' ? '' : parseFloat(value)) : value
      }));
    }
  };

  // POPRAWIONE: Funkcja do custom select
  const handleCustomSelect = (name, value) => {
    if (typeof onFieldChange === 'function') {
      onFieldChange(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setIsCropOpen(false);
    setIsSoilOpen(false);
  };

  const cropOptions = [
    { value: '', label: 'Brak uprawy' },
    { value: 'pszenica', label: 'Pszenica' },
    { value: 'kukurydza', label: 'Kukurydza' },
    { value: 'rzepak', label: 'Rzepak' },
    { value: 'ziemniaki', label: 'Ziemniaki' },
    { value: 'buraki', label: 'Buraki cukrowe' },
    { value: 'owies', label: 'Owies' },
    { value: 'jęczmień', label: 'Jęczmień' },
    { value: 'żyto', label: 'Żyto' }
  ];

  const soilOptions = [
    { value: '', label: 'Wybierz typ gleby' },
    { value: 'gliniasta', label: 'Gliniasta' },
    { value: 'piaszczysta', label: 'Piaszczysta' },
    { value: 'ilasta', label: 'Ilasta' },
    { value: 'torfowa', label: 'Torfowa' },
    { value: 'mada', label: 'Mada rzeczna' }
  ];

  const getCurrentCropLabel = () => {
    const option = cropOptions.find(opt => opt.value === (field?.crop || ''));
    return option ? option.label : 'Brak uprawy';
  };

  const getCurrentSoilLabel = () => {
    const option = soilOptions.find(opt => opt.value === (field?.soil || ''));
    return option ? option.label : 'Wybierz typ gleby';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{field?.id ? 'Edytuj pole' : 'Dodaj nowe pole'}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
            <div className="form-group">
              <label htmlFor="fieldName">Nazwa pola *</label>
              <input
                type="text"
                id="fieldName"
                name="name"
                value={field?.name || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="fieldArea">Powierzchnia (ha) *</label>
              <input
                type="number"
                id="fieldArea"
                name="area"
                value={field?.area || ''}
                onChange={handleInputChange}
                step="0.01"
                required
              />
            </div>
            
            {/* CUSTOM SELECT dla gleby */}
            <div className="form-group">
              <label htmlFor="fieldSoil">Typ gleby *</label>
              <div className="custom-select">
                <div 
                  className={`select-header ${isSoilOpen ? 'open' : ''}`}
                  onClick={() => setIsSoilOpen(!isSoilOpen)}
                >
                  {getCurrentSoilLabel()}
                  <span className="arrow">▼</span>
                </div>
                {isSoilOpen && (
                  <div className="select-options">
                    {soilOptions.map(option => (
                      <div
                        key={option.value}
                        className={`select-option ${field?.soil === option.value ? 'selected' : ''}`}
                        onClick={() => handleCustomSelect('soil', option.value)}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* CUSTOM SELECT dla uprawy */}
            <div className="form-group">
              <label htmlFor="fieldCrop">Aktualna uprawa</label>
              <div className="custom-select">
                <div 
                  className={`select-header ${isCropOpen ? 'open' : ''}`}
                  onClick={() => setIsCropOpen(!isCropOpen)}
                >
                  {getCurrentCropLabel()}
                  <span className="arrow">▼</span>
                </div>
                {isCropOpen && (
                  <div className="select-options">
                    {cropOptions.map(option => (
                      <div
                        key={option.value}
                        className={`select-option ${field?.crop === option.value ? 'selected' : ''}`}
                        onClick={() => handleCustomSelect('crop', option.value)}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="fieldNotes">Notatki</label>
              <textarea
                id="fieldNotes"
                name="notes"
                value={field?.notes || ''}
                onChange={handleInputChange}
                rows="3"
                placeholder="Dodatkowe informacje o polu..."
              />
            </div>
            {field?.coordinates && field.coordinates.length > 0 && (
              <div className="form-group">
                <label>Informacje o narysowanym polu:</label>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  <div>Liczba punktów: {field.coordinates.length}</div>
                  <div>Powierzchnia: {field.area} ha (obliczona automatycznie)</div>
                </div>
              </div>
            )}
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Anuluj
          </button>
          <button 
            className="btn btn-primary" 
            onClick={onSave}
            disabled={saveLoading}
          >
            {saveLoading ? 'Zapisywanie...' : 'Zapisz pole'}
          </button>
        </div>
      </div>
    </div>
  );
};

// NOWY KOMPONENT: Modal statusu pola
const FieldStatusModal = ({ field, status, onStatusChange, onSave, onClose, saveLoading }) => {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (typeof onStatusChange === 'function') {
      onStatusChange(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCustomSelect = (name, value) => {
    if (typeof onStatusChange === 'function') {
      onStatusChange(prev => ({
        ...prev,
        [name]: value
      }));
    }
    if (name === 'status') setIsStatusOpen(false);
    if (name === 'crop') setIsCropOpen(false);
  };

  const statusOptions = [
    { value: 'sown', label: 'Zasiane' },
    { value: 'harvested', label: 'Zebrane' },
    { value: 'ready_for_sowing', label: 'Przygotowane do siewu' },
    { value: 'fallow', label: 'Ugór' },
    { value: 'pasture', label: 'Pastwisko/Łąka' }
  ];

  const cropOptions = [
    { value: '', label: 'Brak uprawy' },
    { value: 'pszenica', label: 'Pszenica' },
    { value: 'kukurydza', label: 'Kukurydza' },
    { value: 'rzepak', label: 'Rzepak' },
    { value: 'ziemniaki', label: 'Ziemniaki' },
    { value: 'buraki', label: 'Buraki cukrowe' },
    { value: 'owies', label: 'Owies' },
    { value: 'jęczmień', label: 'Jęczmień' },
    { value: 'żyto', label: 'Żyto' }
  ];

  const getCurrentStatusLabel = () => {
    const option = statusOptions.find(opt => opt.value === (status?.status || ''));
    return option ? option.label : 'Wybierz stan pola';
  };

  const getCurrentCropLabel = () => {
    const option = cropOptions.find(opt => opt.value === (status?.crop || ''));
    return option ? option.label : 'Brak uprawy';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {field ? `Stan pola: ${field.name}` : 'Zarządzaj stanem pola'}
          </h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
            {field && (
              <div className="form-group">
                <label>Pole</label>
                <input
                  type="text"
                  value={field.name}
                  disabled
                  style={{ backgroundColor: '#f8f9fa', color: '#495057' }}
                />
              </div>
            )}
            
            {/* SELECT dla stanu pola */}
            <div className="form-group">
              <label>Stan pola *</label>
              <div className="custom-select">
                <div 
                  className={`select-header ${isStatusOpen ? 'open' : ''}`}
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                >
                  {getCurrentStatusLabel()}
                  <span className="arrow">▼</span>
                </div>
                {isStatusOpen && (
                  <div className="select-options">
                    {statusOptions.map(option => (
                      <div
                        key={option.value}
                        className={`select-option ${status?.status === option.value ? 'selected' : ''}`}
                        onClick={() => handleCustomSelect('status', option.value)}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SELECT dla uprawy */}
            <div className="form-group">
              <label>Aktualna uprawa</label>
              <div className="custom-select">
                <div 
                  className={`select-header ${isCropOpen ? 'open' : ''}`}
                  onClick={() => setIsCropOpen(!isCropOpen)}
                >
                  {getCurrentCropLabel()}
                  <span className="arrow">▼</span>
                </div>
                {isCropOpen && (
                  <div className="select-options">
                    {cropOptions.map(option => (
                      <div
                        key={option.value}
                        className={`select-option ${status?.crop === option.value ? 'selected' : ''}`}
                        onClick={() => handleCustomSelect('crop', option.value)}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="statusNotes">Notatki</label>
              <textarea
                id="statusNotes"
                name="notes"
                value={status?.notes || ''}
                onChange={handleInputChange}
                rows="3"
                placeholder="Dodatkowe informacje o stanie pola..."
              />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Anuluj
          </button>
          <button 
            className="btn btn-primary" 
            onClick={onSave}
            disabled={saveLoading}
          >
            {saveLoading ? 'Zapisywanie...' : 'Zapisz stan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldsPage;