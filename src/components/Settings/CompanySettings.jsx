import React, { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import './CompanySettings.css';

const CompanySettings = () => {
  const { companySettings, saveCompanySettings, loading } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    nip: '',
    regon: '',
    areaUnit: 'ha',
    currency: 'PLN',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Załaduj dane firmy
  useEffect(() => {
    if (companySettings) {
      setFormData(companySettings);
    }
  }, [companySettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const result = await saveCompanySettings(formData);
    
    if (result.success) {
      setMessage('Ustawienia firmy zostały zapisane!');
    } else {
      setMessage(`Błąd: ${result.error}`);
    }
    
    setSaving(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return <div className="loading">Ładowanie ustawień firmy...</div>;
  }

  return (
    <div className="company-settings">
      <h2>Ustawienia Firmy</h2>
      
      {message && (
        <div className={`message ${message.includes('Błąd') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSave} className="company-form">
        <div className="form-group">
          <label>Nazwa gospodarstwa/firmy</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Adres</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>NIP</label>
            <input
              type="text"
              value={formData.nip}
              onChange={(e) => handleChange('nip', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>REGON</label>
            <input
              type="text"
              value={formData.regon}
              onChange={(e) => handleChange('regon', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Jednostka powierzchni</label>
            <select 
              value={formData.areaUnit}
              onChange={(e) => handleChange('areaUnit', e.target.value)}
            >
              <option value="ha">Hektary (ha)</option>
              <option value="ac">Akry (ac)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Waluta</label>
            <select 
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
            >
              <option value="PLN">PLN</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <button type="submit" className="save-btn" disabled={saving}>
          {saving ? 'Zapisywanie...' : 'Zapisz ustawienia'}
        </button>
      </form>
    </div>
  );
};

export default CompanySettings;