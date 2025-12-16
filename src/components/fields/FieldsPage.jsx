import React, { useState, useEffect, useRef } from 'react';
import { LoadScript, GoogleMap, Polygon, InfoWindow, Marker } from '@react-google-maps/api';
import {
  getFields,
  addField,
  updateField,
  deleteField,
  subscribeToFields,
  getFieldStatus,
  updateFieldStatus,
  addFieldStatus,
  getFieldYields,
  addFieldYield,
  getFieldCosts,
  getFieldStatusHistory
} from '../../services/fieldsService';
import './FieldsPage.css';

const FieldsPage = () => {
  const [fields, setFields] = useState([]);
  const [fieldStatuses, setFieldStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Modale
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false); // NOWY MODAL
  
  const [currentField, setCurrentField] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [fieldHistory, setFieldHistory] = useState({ yields: [], costs: [], statuses: [] });
  
  // Rysowanie
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempPolygon, setTempPolygon] = useState([]);
  
  // UI
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [hoveredField, setHoveredField] = useState(null);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Sortowanie
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });

  // Mapa
  const [mapCenter] = useState({ lat: 53.29684935063282, lng: 21.431474045415577 });
  const [mapZoom] = useState(17);

  const mapRef = useRef();
  const googleRef = useRef();
  const contentRef = useRef();

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
    draggableCursor: isDrawing ? 'crosshair' : 'default',
    scrollwheel: isCtrlPressed,
    gestureHandling: isCtrlPressed ? 'cooperative' : 'greedy'
  };

  // Obsługa CTRL
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Control' || e.key === 'Ctrl') setIsCtrlPressed(true);
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Control' || e.key === 'Ctrl') setIsCtrlPressed(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleMapWheel = (e) => {
    if (isCtrlPressed) {
      e.stopPropagation();
      return;
    }
  };

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
    window.scrollTo(0, 0);
  }, []);

  // Opcje rysowania
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

  // Sortowanie
  const sortFields = (fieldsToSort) => {
    if (!sortConfig.key) return fieldsToSort;

    return [...fieldsToSort].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'status') {
        aValue = getStatusDisplay(a.id);
        bValue = getStatusDisplay(b.id);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) {
      return <span style={{ marginLeft: '8px', color: '#95a5a6', fontSize: '12px' }}>▲▼</span>;
    }
    return (
      <span style={{ marginLeft: '8px', color: '#e74c3c', fontWeight: 'bold' }}>
        {sortConfig.direction === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  // Ładowanie danych
  useEffect(() => {
    const loadFieldsAndStatuses = async () => {
      try {
        setLoading(true);
        const fieldsData = await getFields();
        setFields(fieldsData);

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
      const statuses = {};
      for (const field of fieldsData) {
        try {
          const status = await getFieldStatus(field.id);
          if (status) statuses[field.id] = status;
        } catch (e) { console.error(e); }
      }
      setFieldStatuses(statuses);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setOptions({
        draggableCursor: isDrawing ? 'crosshair' : 'default'
      });
    }
  }, [isDrawing]);

  // Funkcje geograficzne
  const calculateCentroid = (coordinates) => {
    if (!coordinates || coordinates.length === 0) return null;
    const points = coordinates[0].lat === coordinates[coordinates.length - 1].lat &&
      coordinates[0].lng === coordinates[coordinates.length - 1].lng
      ? coordinates.slice(0, -1)
      : coordinates;
    if (points.length === 0) return null;

    let signedArea = 0, centroidX = 0, centroidY = 0;
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

  const calculateDistance = (point1, point2) => {
    if (!googleRef.current || !googleRef.current.maps) return Infinity;
    try {
      const latLng1 = new googleRef.current.maps.LatLng(point1.lat, point1.lng);
      const latLng2 = new googleRef.current.maps.LatLng(point2.lat, point2.lng);
      return googleRef.current.maps.geometry.spherical.computeDistanceBetween(latLng1, latLng2);
    } catch (error) { return Infinity; }
  };

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
    const earthRadius = 6371000;
    const areaM2 = total * earthRadius * earthRadius / 2;
    return (areaM2 / 10000).toFixed(2);
  };

  // Obsługa rysowania
  const onMapClick = (event) => {
    if (!isDrawing) return;
    const newPoint = { lat: event.latLng.lat(), lng: event.latLng.lng() };
    if (tempPolygon.length >= 3) {
      const firstPoint = tempPolygon[0];
      const distance = calculateDistance(firstPoint, newPoint);
      if (distance < 20) {
        finishDrawing();
        return;
      }
    }
    setTempPolygon(prev => [...prev, newPoint]);
  };

  const finishDrawing = () => {
    if (tempPolygon.length < 3) {
      alert('Potrzebujesz co najmniej 3 punkty do utworzenia polygonu!');
      return;
    }
    const closedPolygon = [...tempPolygon, tempPolygon[0]];
    let areaHa = 0;
    if (googleRef.current && googleRef.current.maps) {
      try {
        const areaM2 = googleRef.current.maps.geometry.spherical.computeArea(
          closedPolygon.map(coord => new googleRef.current.maps.LatLng(coord.lat, coord.lng))
        );
        areaHa = (areaM2 / 10000).toFixed(2);
      } catch (error) {
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

  const cancelDrawing = () => {
    setIsDrawing(false);
    setTempPolygon([]);
  };

  const startDrawing = () => {
    setIsDrawing(true);
    setTempPolygon([]);
    setSelectedField(null);
  };

  // --- OBSŁUGA MODALI ---

  const openFieldModal = (field = null) => {
    if (field) setCurrentField(field);
    else setCurrentField({ name: '', area: '', soil: '', crop: '', notes: '', coordinates: [] });
    setIsModalOpen(true);
    cancelDrawing();
  };

  const closeFieldModal = () => {
    setIsModalOpen(false);
    setCurrentField(null);
    setSaveLoading(false);
  };

  const openStatusModal = (field = null) => {
    if (field) {
      setCurrentField(field);
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
      setCurrentStatus({ field_id: '', status: '', crop: '', notes: '', date_created: new Date().toISOString() });
    }
    setIsStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setIsStatusModalOpen(false);
    setCurrentField(null);
    setCurrentStatus(null);
    setSaveLoading(false);
  };

  // --- HISTORIA ---

  const fetchHistoryData = async (fieldId) => {
    try {
      const yields = await getFieldYields(fieldId);
      const costs = await getFieldCosts(fieldId);
      let statuses = [];
      if (typeof getFieldStatusHistory === 'function') {
        statuses = await getFieldStatusHistory(fieldId);
      }
      setFieldHistory({
        yields: yields || [],
        costs: costs || [],
        statuses: statuses || []
      });
    } catch (error) {
      console.error('Błąd odświeżania historii:', error);
    }
  };

  const openHistoryModal = async (field) => {
    setSelectedField(field); 
    setIsHistoryModalOpen(true);
    setFieldHistory({ yields: [], costs: [], statuses: [] });
    setLoading(true);
    await fetchHistoryData(field.id);
    setLoading(false);
  };

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
  };

  const handleHistoryRefresh = async () => {
    if (selectedField) {
      await fetchHistoryData(selectedField.id);
    }
  };

  // --- NOWE: FUNKCJE DLA ZBIORÓW (HARVEST) ---

  const openHarvestModal = (field) => {
    setCurrentField(field);
    setIsHarvestModalOpen(true);
  };

  const closeHarvestModal = () => {
    setIsHarvestModalOpen(false);
    setCurrentField(null);
  };

const handleSaveHarvest = async (yieldData) => {
  try {
    setSaveLoading(true);

    // 1. Dodaj zbiór do tabeli plonów
    await addFieldYield(yieldData);

    // 2. Utwórz nowy status 'harvested' (Zebrane)
    // To też musi być NOWY wpis, żeby nie nadpisać poprzedniego stanu (np. "Dojrzewanie")
    const newStatus = {
      field_id: currentField.id,
      status: 'harvested',
      crop: yieldData.crop,
      yield_amount: yieldData.amount,       // Zapisujemy plon w historii
      yield_moisture: yieldData.moisture,   // Zapisujemy wilgotność w historii
      notes: `Zbiór automatyczny: ${yieldData.amount}t`,
      date_created: new Date().toISOString()
    };
    
    // 3. Dodaj do historii (ADD, nie UPDATE)
    const newDocId = await addFieldStatus(newStatus);

    // 4. Aktualizacja głównego pola (żeby w tabeli była dobra uprawa)
    await updateField(currentField.id, {
      crop: yieldData.crop 
    });

    // 5. Aktualizacja UI
    setFieldStatuses(prev => ({
      ...prev,
      [currentField.id]: { ...newStatus, id: newDocId }
    }));

    setFields(prevFields => prevFields.map(f => 
      f.id === currentField.id 
        ? { ...f, crop: yieldData.crop }
        : f
    ));

    closeHarvestModal();
  } catch (error) {
    console.error('Błąd zapisu zbioru:', error);
    alert('Wystąpił błąd podczas zapisywania zbioru: ' + error.message);
  } finally {
    setSaveLoading(false);
  }
};
  // --- OPERACJE NA POLACH ---

// Podmień funkcję saveField na tę wersję:
const saveField = async () => {
  if (!currentField?.name || !currentField?.area || !currentField?.soil) {
    alert('Proszę wypełnić wszystkie wymagane pola!');
    return;
  }

  try {
    setSaveLoading(true);

    // TWORZYMY OBIEKT BEZ POLA 'CROP'
    // Uprawa jest teraz zarządzana WYŁĄCZNIE przez status
    const fieldData = {
      name: currentField.name.trim(),
      area: parseFloat(currentField.area),
      soil: currentField.soil,
      notes: currentField.notes || '',
      coordinates: currentField.coordinates
      // Usunięto: crop: currentField.crop || '' 
    };

    if (currentField.id) {
      await updateField(currentField.id, fieldData);
    } else {
      // Przy nowym polu dodajemy pustą uprawę, bo jeszcze nie ma statusu
      await addField({ ...fieldData, crop: '' });
    }

    closeFieldModal();
  } catch (error) {
    console.error('Error saving field:', error);
    alert('Błąd podczas zapisywania pola: ' + error.message);
    setSaveLoading(false);
  }
};

  // Podmień funkcję saveFieldStatus na tę wersję:
const saveFieldStatus = async () => {
  if (!currentStatus?.status) {
    alert('Proszę wybrać stan pola!');
    return;
  }

  try {
    setSaveLoading(true);

    // TWORZYMY NOWY OBIEKT STATUSU (bez ID)
    // Dzięki temu Firebase potraktuje to jako NOWY wpis, a nie edycję starego
    const statusPayload = {
      field_id: currentStatus.field_id,
      status: currentStatus.status,
      crop: currentStatus.crop || '',
      notes: currentStatus.notes || '',
      date_created: new Date().toISOString() // Zawsze nowa data
      // Ważne: Nie przesyłamy tutaj 'id', żeby wymusić utworzenie nowego dokumentu
    };

    // 1. Zawsze używamy addFieldStatus (DODAJ), nigdy update
    const newDocId = await addFieldStatus(statusPayload);

    // 2. Aktualizuj uprawę w głównym dokumencie pola (dla mapy i tabeli)
    if (currentStatus.field_id) {
      await updateField(currentStatus.field_id, {
        crop: currentStatus.crop || '' 
      });
      
      // Aktualizacja tabeli na żywo
      setFields(prevFields => prevFields.map(f => 
        f.id === currentStatus.field_id 
          ? { ...f, crop: currentStatus.crop || '' }
          : f
      ));
    }

    // 3. Aktualizuj lokalny stan statusów (dla kolorów w tabeli)
    setFieldStatuses(prev => ({
      ...prev,
      [currentStatus.field_id]: { ...statusPayload, id: newDocId }
    }));

    closeStatusModal();
  } catch (error) {
    console.error('Error saving field status:', error);
    alert('Błąd podczas zapisywania stanu pola: ' + error.message);
    setSaveLoading(false);
  }
};

  const handleDeleteField = async (id) => {
    try {
      await deleteField(id);
      setDeleteConfirm(null);
      if (selectedField?.id === id) setSelectedField(null);
    } catch (error) {
      alert('Błąd podczas usuwania pola: ' + error.message);
      setDeleteConfirm(null);
    }
  };

  const onFieldClick = (field) => {
    if (!isDrawing) setSelectedField(field);
  };

  const editField = (id) => {
    const field = fields.find(f => f.id === id);
    if (field) openFieldModal(field);
  };

  const selectFieldFromList = (field) => {
    setSelectedField(field);
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

  const hoverFieldFromList = (field) => setHoveredField(field);
  const leaveFieldFromList = () => setHoveredField(null);

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

  const filteredFields = fields.filter(field =>
    field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.soil.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (field.crop && field.crop.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const sortedAndFilteredFields = sortFields(filteredFields);

  return (
    <div className="fields-page" ref={contentRef}>
      <div className="fields-header">
        <h2>Zarządzanie polami</h2>
        <div className="actions-bar">
          <div className="action-buttons">
            <button
              className={`btn ${isDrawing ? 'btn-danger' : 'btn-secondary'}`}
              onClick={isDrawing ? cancelDrawing : startDrawing}
            >
              <i className="fas fa-draw-polygon"></i>
              {isDrawing ? 'Anuluj rysowanie' : 'Narysuj pole'}
            </button>
            {isDrawing && tempPolygon.length >= 3 && (
              <button className="btn btn-success" onClick={finishDrawing}>
                <i className="fas fa-check"></i> Zakończ rysowanie
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="fields-content">
        <div className={`map-container ${isDrawing ? 'drawing-active' : ''}`}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={mapZoom}
            options={mapOptions}
            onLoad={(map) => { mapRef.current = map; }}
            onClick={onMapClick}
            onWheel={handleMapWheel}
          >
            {isDrawing && tempPolygon.length > 0 && (
              <>
                <Polygon paths={tempPolygon} options={tempPolygonOptions} />
                {tempPolygon.map((point, index) => (
                  <Marker
                    key={index}
                    position={point}
                    label={{
                      text: (index + 1).toString(), color: 'white', fontSize: '12px', fontWeight: 'bold'
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

            {selectedField && (
              <InfoWindow
                position={calculateCentroid(selectedField.coordinates) || (selectedField.coordinates && selectedField.coordinates[0]) || mapCenter}
                onCloseClick={() => setSelectedField(null)}
                options={{ pixelOffset: new window.google.maps.Size(0, -40), maxWidth: 300 }}
              >
                <div className="field-info-window">
                  <h3>{selectedField.name}</h3>
                  <div className="field-info-details">
                    <p><i className="fas fa-ruler-combined"></i><strong>Powierzchnia:</strong> {selectedField.area} ha</p>
                    <p><i className="fas fa-mountain"></i><strong>Gleba:</strong> {selectedField.soil}</p>
                    <p><i className="fas fa-seedling"></i><strong>Uprawa: </strong> {selectedField.crop || 'Brak'}</p>
                    <p><i className="fas fa-chart-line"></i><strong>Stan: </strong> {getStatusDisplay(selectedField.id)}</p>
                    {selectedField.notes && (
                      <p><i className="fas fa-sticky-note"></i><strong>Notatki: </strong> {selectedField.notes}</p>
                    )}
                  </div>
                  <div className="field-info-actions">
                    <button className="action-btn btn-primary" onClick={() => editField(selectedField.id)}>
                      <i className="fas fa-edit"></i> Edytuj
                    </button>
                    <button className="action-btn btn-info" onClick={() => openStatusModal(selectedField)}>
                      <i className="fas fa-seedling"></i> Stan
                    </button>
                    <button className="action-btn btn-secondary" onClick={() => openHistoryModal(selectedField)}>
                      <i className="fas fa-history"></i> Historia
                    </button>
                    <button className="action-btn btn-danger" onClick={() => setDeleteConfirm(selectedField)}>
                      <i className="fas fa-trash"></i> Usuń
                    </button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>

          {isDrawing && (
            <div className="drawing-instruction">
              <div className="instruction-content">
                <i className="fas fa-info-circle"></i>
                <div>
                  <div><strong>Instrukcja rysowania:</strong></div>
                  <div>Kliknij na mapę, aby dodać punkty polygonu</div>
                  <div>Minimalnie 3 punkty - aktualnie: {tempPolygon.length}</div>
                  {tempPolygon.length >= 3 && (
                    <div style={{ color: '#27ae60', fontWeight: 'bold' }}>Kliknij w pobliżu pierwszego punktu, aby zamknąć polygon</div>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="zoom-instruction">
            <i className="fas fa-info-circle"></i> <strong>Zoom:</strong> Przytrzymaj Ctrl + scroll
          </div>
        </div>

        <div className="fields-list">
          <div className="fields-list-header">
            <h3>Lista pól ({sortedAndFilteredFields.length})</h3>
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input type="text" placeholder="Szukaj pola..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          {sortedAndFilteredFields.length === 0 ? (
            <div className="no-fields"><p>Brak pól do wyświetlenia</p></div>
          ) : (
            <table className="fields-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('name')}>
                    <div className="th-content">Nazwa {renderSortArrow('name')}</div>
                  </th>
                  <th className="sortable" onClick={() => handleSort('area')}>
                    <div className="th-content">Powierzchnia (ha) {renderSortArrow('area')}</div>
                  </th>
                  <th className="sortable" onClick={() => handleSort('soil')}>
                    <div className="th-content">Typ gleby {renderSortArrow('soil')}</div>
                  </th>
                  <th className="sortable" onClick={() => handleSort('crop')}>
                    <div className="th-content">Uprawa {renderSortArrow('crop')}</div>
                  </th>
                  <th className="sortable" onClick={() => handleSort('status')}>
                    <div className="th-content">Stan {renderSortArrow('status')}</div>
                  </th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredFields.map(field => {
                  // Sprawdzenie statusu dla każdego wiersza
                  const currentStatus = fieldStatuses[field.id];
                  const isSown = currentStatus && currentStatus.status === 'sown';
                  
                  return (
                    <tr
                      key={field.id}
                      className={`field-row ${selectedField?.id === field.id ? 'selected' : ''} ${hoveredField?.id === field.id ? 'hovered' : ''}`}
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
                      <td>{capitalizeFirstLetter(field.soil)}</td>
                      <td>{field.crop ? capitalizeFirstLetter(field.crop) : 'Brak'}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: getStatusColor(field.id),
                            color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600'
                          }}
                          onClick={(e) => { e.stopPropagation(); openStatusModal(field); }}
                        >
                          {getStatusDisplay(field.id)}
                        </span>
                      </td>
                      <td className="action-buttons">

                        {/* PRZYCISK DODAJ ZBIÓR - TYLKO GDY ZASIANE */}
                        {isSown && (
                          <button 
                            className="action-btn" 
                            style={{ backgroundColor: '#2ecc71', color: 'white' }} 
                            onClick={(e) => { e.stopPropagation(); openHarvestModal(field); }}
                            title="Dodaj zbiór (zmieni status na Zebrane)"
                          >
                            <i className="fas fa-tractor"></i> Dodaj zbiór
                          </button>
                        )}

                        <button className="action-btn btn-primary" onClick={(e) => { e.stopPropagation(); editField(field.id); }}>
                          <i className="fas fa-edit"></i> Edytuj
                        </button>
                        <button className="action-btn btn-info" onClick={(e) => { e.stopPropagation(); openStatusModal(field); }}>
                          <i className="fas fa-seedling"></i> Stan
                        </button>
                        <button className="action-btn btn-secondary" onClick={(e) => { e.stopPropagation(); openHistoryModal(field); }}>
                          <i className="fas fa-history"></i> Historia
                        </button>
                        <button className="action-btn btn-danger" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(field); }}>
                          <i className="fas fa-trash"></i> Usuń
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && currentField && (
        <FieldModal
          field={currentField}
          onFieldChange={setCurrentField}
          onSave={saveField}
          onClose={closeFieldModal}
          saveLoading={saveLoading}
        />
      )}

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

      {/* MODAL HISTORII (bez dodawania) */}
      {isHistoryModalOpen && selectedField && (
        <FieldHistoryModal
          field={selectedField}
          historyData={fieldHistory}
          onClose={closeHistoryModal}
          onRefresh={handleHistoryRefresh}
        />
      )}

      {/* NOWY MODAL ZBIORU */}
      {isHarvestModalOpen && currentField && (
        <HarvestModal
          field={currentField}
          currentStatus={fieldStatuses[currentField.id]} // Przekazujemy status, aby znać uprawę
          onSave={handleSaveHarvest}
          onClose={closeHarvestModal}
          saveLoading={saveLoading}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Potwierdzenie usunięcia</h3>
              <button className="close-btn" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Czy na pewno chcesz usunąć pole <strong>"{deleteConfirm.name}"</strong>?</p>
              <div className="delete-confirm-warning">
                <i className="fas fa-exclamation-triangle"></i><span>Tej operacji nie można cofnąć.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Anuluj</button>
              <button className="btn btn-danger" onClick={() => handleDeleteField(deleteConfirm.id)}>
                <i className="fas fa-trash"></i> Tak, usuń
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- KOMPONENTY MODALI ---

const FieldModal = ({ field, onFieldChange, onSave, onClose, saveLoading }) => {
  // Usunąłem isCropOpen, zostaje tylko soil
  const [isSoilOpen, setIsSoilOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFieldChange(prev => ({ ...prev, [name]: name === 'area' ? (value === '' ? '' : parseFloat(value)) : value }));
  };

  const handleCustomSelect = (name, value) => {
    onFieldChange(prev => ({ ...prev, [name]: value }));
    setIsSoilOpen(false);
  };

  // cropOptions usunięte - nie są potrzebne w tym modalu

  const soilOptions = [
    { value: '', label: 'Wybierz typ gleby' },
    { value: 'gliniasta', label: 'Gliniasta' },
    { value: 'piaszczysta', label: 'Piaszczysta' },
    { value: 'ilasta', label: 'Ilasta' },
    { value: 'torfowa', label: 'Torfowa' },
    { value: 'mada', label: 'Mada rzeczna' }
  ];

  // getCurrentCropLabel usunięte
  
  const getCurrentSoilLabel = () => soilOptions.find(opt => opt.value === (field?.soil || ''))?.label || 'Wybierz typ gleby';

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
              <input type="text" id="fieldName" name="name" value={field?.name || ''} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="fieldArea">Powierzchnia (ha) *</label>
              <input type="number" id="fieldArea" name="area" value={field?.area || ''} onChange={handleInputChange} step="0.01" required />
            </div>
            
            <div className="form-group">
              <label htmlFor="fieldSoil">Typ gleby *</label>
              <div className="custom-select">
                <div className={`select-header ${isSoilOpen ? 'open' : ''}`} onClick={() => setIsSoilOpen(!isSoilOpen)}>
                  {getCurrentSoilLabel()} <span className="arrow">▼</span>
                </div>
                {isSoilOpen && (
                  <div className="select-options">
                    {soilOptions.map(option => (
                      <div key={option.value} className={`select-option ${field?.soil === option.value ? 'selected' : ''}`} onClick={() => handleCustomSelect('soil', option.value)}>
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SEKJA "AKTUALNA UPRAWA" ZOSTAŁA USUNIĘTA ZGODNIE Z PROŚBĄ */}

            <div className="form-group">
              <label htmlFor="fieldNotes">Notatki</label>
              <textarea id="fieldNotes" name="notes" value={field?.notes || ''} onChange={handleInputChange} rows="3" placeholder="Dodatkowe informacje o polu..." />
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
          <button className="btn btn-secondary" onClick={onClose}>Anuluj</button>
          <button className="btn btn-primary" onClick={onSave} disabled={saveLoading}>{saveLoading ? 'Zapisywanie...' : 'Zapisz pole'}</button>
        </div>
      </div>
    </div>
  );
};

const FieldStatusModal = ({ field, status, onStatusChange, onSave, onClose, saveLoading }) => {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onStatusChange(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomSelect = (name, value) => {
    onStatusChange(prev => ({ ...prev, [name]: value }));
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

  const getCurrentStatusLabel = () => statusOptions.find(opt => opt.value === (status?.status || ''))?.label || 'Wybierz stan pola';
  const getCurrentCropLabel = () => cropOptions.find(opt => opt.value === (status?.crop || ''))?.label || 'Brak uprawy';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{field ? `Stan pola: ${field.name}` : 'Zarządzaj stanem pola'}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
            {field && (
              <div className="form-group">
                <label>Pole</label>
                <input type="text" value={field.name} disabled style={{ backgroundColor: '#f8f9fa', color: '#495057' }} />
              </div>
            )}
            <div className="form-group">
              <label>Stan pola *</label>
              <div className="custom-select">
                <div className={`select-header ${isStatusOpen ? 'open' : ''}`} onClick={() => setIsStatusOpen(!isStatusOpen)}>
                  {getCurrentStatusLabel()} <span className="arrow">▼</span>
                </div>
                {isStatusOpen && (
                  <div className="select-options">
                    {statusOptions.map(option => (
                      <div key={option.value} className={`select-option ${status?.status === option.value ? 'selected' : ''}`} onClick={() => handleCustomSelect('status', option.value)}>
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Aktualna uprawa</label>
              <div className="custom-select">
                <div className={`select-header ${isCropOpen ? 'open' : ''}`} onClick={() => setIsCropOpen(!isCropOpen)}>
                  {getCurrentCropLabel()} <span className="arrow">▼</span>
                </div>
                {isCropOpen && (
                  <div className="select-options">
                    {cropOptions.map(option => (
                      <div key={option.value} className={`select-option ${status?.crop === option.value ? 'selected' : ''}`} onClick={() => handleCustomSelect('crop', option.value)}>
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="statusNotes">Notatki</label>
              <textarea id="statusNotes" name="notes" value={status?.notes || ''} onChange={handleInputChange} rows="3" placeholder="Dodatkowe informacje o stanie pola..." />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Anuluj</button>
          <button className="btn btn-primary" onClick={onSave} disabled={saveLoading}>{saveLoading ? 'Zapisywanie...' : 'Zapisz stan'}</button>
        </div>
      </div>
    </div>
  );
};

// === NOWY MODAL: HarvestModal (Formularz dodawania zbioru) ===
const HarvestModal = ({ field, currentStatus, onSave, onClose, saveLoading }) => {
  const [harvestData, setHarvestData] = useState({
    crop: currentStatus?.crop || field.crop || '', // Domyślnie bierzemy uprawę ze statusu
    amount: '',
    moisture: '',
    date_created: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!harvestData.amount || !harvestData.crop) {
      alert('Wprowadź ilość i rodzaj uprawy.');
      return;
    }

    const yieldPayload = {
      field_id: field.id,
      crop: harvestData.crop,
      amount: parseFloat(harvestData.amount),
      moisture: parseFloat(harvestData.moisture) || 0,
      yield_per_ha: (parseFloat(harvestData.amount) / parseFloat(field.area)).toFixed(2),
      date_created: new Date(harvestData.date_created).toISOString()
    };

    onSave(yieldPayload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="fas fa-tractor" style={{color: '#27ae60'}}></i> Dodaj zbiór: {field.name}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="info-box" style={{background: '#e9f7ef', padding: '10px', borderRadius: '5px', marginBottom: '15px', border: '1px solid #c3e6cb', color: '#155724'}}>
            <i className="fas fa-info-circle"></i> Zapisanie zbioru automatycznie zmieni status pola na <strong>Zebrane</strong>.
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Data zbioru</label>
              <input 
                type="date" 
                value={harvestData.date_created} 
                onChange={e => setHarvestData({...harvestData, date_created: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Uprawa (zbierana roślina)</label>
              <input 
                type="text" 
                value={harvestData.crop} 
                onChange={e => setHarvestData({...harvestData, crop: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Ilość łącznie (tony) *</label>
              <input 
                type="number" 
                step="0.01"
                value={harvestData.amount} 
                onChange={e => setHarvestData({...harvestData, amount: e.target.value})}
                placeholder="np. 45.5"
                required
              />
            </div>
            <div className="form-group">
              <label>Wilgotność (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={harvestData.moisture} 
                onChange={e => setHarvestData({...harvestData, moisture: e.target.value})}
                placeholder="np. 14.5"
              />
            </div>
            
            <div className="modal-footer" style={{padding: '15px 0 0 0'}}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Anuluj</button>
              <button type="submit" className="btn btn-success" disabled={saveLoading}>
                {saveLoading ? 'Zapisywanie...' : 'Zapisz zbiór i zmień status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// === ZMODYFIKOWANY MODAL HISTORII (Bez dodawania) ===
const FieldHistoryModal = ({ field, historyData, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('timeline');
  
  // Funkcja łącząca dane do osi czasu (Timeline)
  const getTimelineEvents = () => {
    const events = [];
    
    // Zbiory
    historyData.yields.forEach(y => {
      events.push({ type: 'yield', date: y.date_created, data: y });
    });

    // Koszty
    historyData.costs.forEach(c => {
      events.push({ type: 'cost', date: c.date_created, data: c });
    });

    // Statusy
    historyData.statuses.forEach(s => {
      events.push({ type: 'status', date: s.date_created || s.date_updated, data: s });
    });

    // Sortuj malejąco po dacie
    return events.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content history-modal" onClick={e => e.stopPropagation()} style={{maxWidth: '700px'}}>
        <div className="modal-header">
          <h3>Historia pola: {field.name}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="tabs-header">
          <button className={activeTab === 'timeline' ? 'active' : ''} onClick={() => setActiveTab('timeline')}>
            <i className="fas fa-stream"></i> Oś czasu
          </button>
          <button className={activeTab === 'yields' ? 'active' : ''} onClick={() => setActiveTab('yields')}>
            <i className="fas fa-tractor"></i> Rejestr zbiorów
          </button>
        </div>

        <div className="modal-body scrollable">
          {activeTab === 'timeline' && (
            <div className="timeline-container">
              {getTimelineEvents().length === 0 && (
                <div className="empty-state">
                  <i className="fas fa-history"></i>
                  <p>Brak historii dla tego pola</p>
                </div>
              )}
              {getTimelineEvents().map((event, idx) => (
                <div key={idx} className={`timeline-item ${event.type}`}>
                  <div className="timeline-date">
                    {new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className="timeline-content">
                    {event.type === 'yield' && (
                      <>
                        <strong><i className="fas fa-tractor"></i> Zbiór: {event.data.crop}</strong>
                        <p>Ilość: {event.data.amount} t ({event.data.yield_per_ha} t/ha)</p>
                        {event.data.moisture > 0 && <p>Wilgotność: {event.data.moisture}%</p>}
                      </>
                    )}
                    {event.type === 'cost' && (
                      <>
                        <strong><i className="fas fa-coins"></i> Wydatek: {event.data.category}</strong>
                        <p>{event.data.amount} PLN - {event.data.description}</p>
                      </>
                    )}
                    {event.type === 'status' && (
                      <>
                        <strong><i className="fas fa-exchange-alt"></i> Zmiana statusu</strong>
                        <p>Status: {
                            event.data.status === 'sown' ? 'Zasiane' :
                            event.data.status === 'harvested' ? 'Zebrane' :
                            event.data.status === 'ready_for_sowing' ? 'Do siewu' :
                            event.data.status
                        }</p>
                        {event.data.crop && <p>Uprawa: {event.data.crop}</p>}
                        {event.data.notes && <p><em>"{event.data.notes}"</em></p>}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'yields' && (
            <div>
              {/* USUNIĘTO PRZYCISK DODAWANIA ZBIORU Z TEGO MIEJSCA */}
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Uprawa</th>
                    <th>Plon (t)</th>
                    <th>Plon (t/ha)</th>
                    <th>Wilgotność</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.yields.length === 0 && (
                    <tr><td colSpan="5" style={{textAlign:'center'}}>Brak zarejestrowanych zbiorów</td></tr>
                  )}
                  {historyData.yields.map(y => (
                    <tr key={y.id}>
                      <td>{new Date(y.date_created).toLocaleDateString()}</td>
                      <td>{y.crop}</td>
                      <td>{y.amount}</td>
                      <td>{y.yield_per_ha}</td>
                      <td>{y.moisture ? y.moisture + '%' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FieldsPage;