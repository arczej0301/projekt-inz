// components/pages/TestPage.jsx
import React, { useState } from 'react';
import './TestPage.css';

function TestPage() {
  // Test 1: Native HTML Select
  const [nativeSelectValue, setNativeSelectValue] = useState('');
  
  // Test 2: Custom Select
  const [customSelectValue, setCustomSelectValue] = useState('');
  const [isCustomSelectOpen, setIsCustomSelectOpen] = useState(false);
  
  // Test 3: Multiple Custom Selects
  const [selectsData, setSelectsData] = useState({
    category: '',
    status: '', 
    type: ''
  });
  const [openSelect, setOpenSelect] = useState(null);

  // Opcje dla list
  const categories = [
    { value: '', label: 'Wybierz kategorię' },
    { value: 'zboza', label: 'Zboża' },
    { value: 'warzywa', label: 'Warzywa' },
    { value: 'owoce', label: 'Owoce' },
    { value: 'narzedzia', label: 'Narzędzia' }
  ];

  const statuses = [
    { value: '', label: 'Wybierz status' },
    { value: 'active', label: 'Aktywny' },
    { value: 'inactive', label: 'Nieaktywny' },
    { value: 'pending', label: 'Oczekujący' }
  ];

  const types = [
    { value: '', label: 'Wybierz typ' },
    { value: 'type1', label: 'Typ 1' },
    { value: 'type2', label: 'Typ 2' },
    { value: 'type3', label: 'Typ 3' }
  ];

  // Handlery dla Native Select
  const handleNativeSelectChange = (e) => {
    const value = e.target.value;
    setNativeSelectValue(value);
    console.log('🎯 NATIVE SELECT - Wybrano:', value);
    console.log('📋 NATIVE SELECT - Event:', e);
    console.log('🔍 NATIVE SELECT - Target value:', e.target.value);
  };

  // Handlery dla Custom Select
  const handleCustomSelectToggle = () => {
    console.log('🔄 CUSTOM SELECT - Toggle, obecny stan:', isCustomSelectOpen);
    setIsCustomSelectOpen(!isCustomSelectOpen);
  };

  const handleCustomSelectChoose = (value) => {
    console.log('🎯 CUSTOM SELECT - Kliknięto opcję:', value);
    setCustomSelectValue(value);
    setIsCustomSelectOpen(false);
    console.log('✅ CUSTOM SELECT - Ustawiono wartość:', value);
  };

  // Handlery dla Multiple Custom Selects
  const handleMultipleSelectToggle = (selectName) => {
    console.log('🔄 MULTIPLE SELECT - Toggle:', selectName, 'obecnie otwarty:', openSelect);
    setOpenSelect(openSelect === selectName ? null : selectName);
  };

  const handleMultipleSelectChoose = (selectName, value) => {
    console.log('🎯 MULTIPLE SELECT - Wybór:', selectName, 'wartość:', value);
    setSelectsData(prev => ({
      ...prev,
      [selectName]: value
    }));
    setOpenSelect(null);
    console.log('📊 MULTIPLE SELECT - Nowe dane:', { ...selectsData, [selectName]: value });
  };

  // Funkcja do uzyskania labela dla wartości
  const getLabelForValue = (value, options) => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : 'Wybierz...';
  };

  return (
    <div className="test-page">
      <div className="test-header">
        <h2>🧪 Test List Rozwijanych</h2>
        <p>Strona do testowania działania list wyboru i logowania danych</p>
      </div>

      <div className="test-sections">
        
        {/* SEKCJA 1: Native HTML Select */}
        <section className="test-section">
          <h3>1. Native HTML Select</h3>
          <div className="form-group">
            <label>Native Select:</label>
            <select 
              value={nativeSelectValue}
              onChange={handleNativeSelectChange}
              className="test-select"
            >
              {categories.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="current-value">
            <strong>Aktualna wartość:</strong> {nativeSelectValue || 'brak'}
          </div>
        </section>

        {/* SEKCJA 2: Custom Select */}
        <section className="test-section">
          <h3>2. Custom Select (pojedynczy)</h3>
          <div className="form-group">
            <label>Custom Select:</label>
            <div className="custom-select-test">
              <div 
                className={`select-header-test ${isCustomSelectOpen ? 'open' : ''}`}
                onClick={handleCustomSelectToggle}
              >
                {getLabelForValue(customSelectValue, categories)}
                <span className="arrow-test">▼</span>
              </div>
              {isCustomSelectOpen && (
                <div className="select-options-test">
                  {categories.map(option => (
                    <div
                      key={option.value}
                      className={`select-option-test ${customSelectValue === option.value ? 'selected' : ''}`}
                      onClick={() => handleCustomSelectChoose(option.value)}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="current-value">
            <strong>Aktualna wartość:</strong> {customSelectValue || 'brak'}
          </div>
        </section>

        {/* SEKCJA 3: Multiple Custom Selects */}
        <section className="test-section">
          <h3>3. Multiple Custom Selects (jak w aplikacji)</h3>
          
          <div className="form-row-test">
            <div className="form-group">
              <label>Kategoria:</label>
              <div className="custom-select-test">
                <div 
                  className={`select-header-test ${openSelect === 'category' ? 'open' : ''}`}
                  onClick={() => handleMultipleSelectToggle('category')}
                >
                  {getLabelForValue(selectsData.category, categories)}
                  <span className="arrow-test">▼</span>
                </div>
                {openSelect === 'category' && (
                  <div className="select-options-test">
                    {categories.map(option => (
                      <div
                        key={option.value}
                        className={`select-option-test ${selectsData.category === option.value ? 'selected' : ''}`}
                        onClick={() => handleMultipleSelectChoose('category', option.value)}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Status:</label>
              <div className="custom-select-test">
                <div 
                  className={`select-header-test ${openSelect === 'status' ? 'open' : ''}`}
                  onClick={() => handleMultipleSelectToggle('status')}
                >
                  {getLabelForValue(selectsData.status, statuses)}
                  <span className="arrow-test">▼</span>
                </div>
                {openSelect === 'status' && (
                  <div className="select-options-test">
                    {statuses.map(option => (
                      <div
                        key={option.value}
                        className={`select-option-test ${selectsData.status === option.value ? 'selected' : ''}`}
                        onClick={() => handleMultipleSelectChoose('status', option.value)}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Typ:</label>
              <div className="custom-select-test">
                <div 
                  className={`select-header-test ${openSelect === 'type' ? 'open' : ''}`}
                  onClick={() => handleMultipleSelectToggle('type')}
                >
                  {getLabelForValue(selectsData.type, types)}
                  <span className="arrow-test">▼</span>
                </div>
                {openSelect === 'type' && (
                  <div className="select-options-test">
                    {types.map(option => (
                      <div
                        key={option.value}
                        className={`select-option-test ${selectsData.type === option.value ? 'selected' : ''}`}
                        onClick={() => handleMultipleSelectChoose('type', option.value)}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="current-values">
            <h4>Aktualne wartości:</h4>
            <pre>{JSON.stringify(selectsData, null, 2)}</pre>
          </div>
        </section>

        {/* SEKCJA 4: Instrukcje */}
        <section className="test-section">
          <h3>ℹ️ Instrukcje testowania</h3>
          <div className="instructions">
            <p><strong>1. Otwórz konsolę przeglądarki (F12)</strong></p>
            <p><strong>2. Testuj każdy select i obserwuj logi:</strong></p>
            <ul>
              <li>🎯 - Wybór wartości</li>
              <li>🔄 - Otwieranie/zamykanie</li>
              <li>📋 - Szczegóły eventu</li>
              <li>✅ - Potwierdzenie ustawienia</li>
            </ul>
            <p><strong>3. Sprawdź czy:</strong></p>
            <ul>
              <li>Wartości są poprawnie logowane</li>
              <li>Selecty otwierają się i zamykają</li>
              <li>Nie ma błędów w konsoli</li>
              <li>Wartości się aktualizują</li>
            </ul>
          </div>
        </section>

{/* SEKCJA 5: Czysty HTML - poza React */}
<section className="test-section">
  <h3>5. Czysty HTML (poza React)</h3>
  <div className="form-group">
    <label>Select czysty HTML:</label>
    {/* Ten select jest renderowany bezpośrednio - React go nie kontroluje */}
    <select id="pureHtmlSelect" onchange="console.log('🏷️ PURE HTML SELECT:', this.value)">
      <option value="">Czysty HTML</option>
      <option value="html1">HTML Opcja 1</option>
      <option value="html2">HTML Opcja 2</option>
      <option value="html3">HTML Opcja 3</option>
    </select>
  </div>

  {/* Drugi test z inline styling */}
  <div className="form-group">
    <label>Select z inline styles:</label>
    <select 
      style={{
        padding: '10px',
        border: '2px solid red',
        background: 'white',
        width: '100%',
        fontSize: '16px'
      }}
      onMouseDown={(e) => console.log('🔴 RED SELECT - MouseDown')}
      onChange={(e) => console.log('🔴 RED SELECT - Change:', e.target.value)}
    >
      <option value="">Czerwony select</option>
      <option value="red1">Czerwony 1</option>
      <option value="red2">Czerwony 2</option>
    </select>
  </div>
</section>
      </div>
    </div>
  );
}

export default TestPage;