import React, { useState } from 'react';

const CompanySettings = () => {
  const [companyData, setCompanyData] = useState({
    name: 'Gospodarstwo Rolne Kowalski',
    address: 'Wiejska 123, 00-001 Wola',
    nip: '1234567890',
    regon: '123456789',
    areaUnit: 'ha',
    currency: 'PLN',
  });

  const handleSave = (e) => {
    e.preventDefault();
    alert('Ustawienia firmy zostały zapisane!');
  };

  return (
    <div className="company-settings">
      <h2>Ustawienia Firmy</h2>
      
      <form onSubmit={handleSave} className="company-form">
        <div className="form-group">
          <label>Nazwa gospodarstwa/firmy</label>
          <input
            type="text"
            value={companyData.name}
            onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Adres</label>
          <input
            type="text"
            value={companyData.address}
            onChange={(e) => setCompanyData({...companyData, address: e.target.value})}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>NIP</label>
            <input
              type="text"
              value={companyData.nip}
              onChange={(e) => setCompanyData({...companyData, nip: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>REGON</label>
            <input
              type="text"
              value={companyData.regon}
              onChange={(e) => setCompanyData({...companyData, regon: e.target.value})}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Jednostka powierzchni</label>
            <select 
              value={companyData.areaUnit}
              onChange={(e) => setCompanyData({...companyData, areaUnit: e.target.value})}
            >
              <option value="ha">Hektary (ha)</option>
              <option value="ac">Akry (ac)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Waluta</label>
            <select 
              value={companyData.currency}
              onChange={(e) => setCompanyData({...companyData, currency: e.target.value})}
            >
              <option value="PLN">PLN</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <button type="submit" className="save-btn">
          Zapisz ustawienia
        </button>
      </form>
    </div>
  );
};

export default CompanySettings;