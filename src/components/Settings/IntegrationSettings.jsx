import React from 'react';

const IntegrationSettings = () => {
  return (
    <div className="integration-settings">
      <h2>Integracje</h2>
      
      <div className="integration-list">
        <div className="integration-item">
          <div className="integration-info">
            <h3>🔥 Firebase</h3>
            <p>Baza danych i autentykacja</p>
            <span className="status connected">Połączono</span>
          </div>
        </div>

        <div className="integration-item">
          <div className="integration-info">
            <h3>📧 Email SMTP</h3>
            <p>Wysyłanie powiadomień email</p>
            <span className="status not-configured">Nie skonfigurowano</span>
          </div>
          <button className="configure-btn">Skonfiguruj</button>
        </div>

        <div className="integration-item">
          <div className="integration-info">
            <h3>📊 Google Analytics</h3>
            <p>Analityka użycia aplikacji</p>
            <span className="status not-configured">Nie skonfigurowano</span>
          </div>
          <button className="configure-btn">Skonfiguruj</button>
        </div>
      </div>

      <div className="backup-section">
        <h3>Kopia zapasowa</h3>
        <p>Utwórz kopię zapasową wszystkich danych gospodarstwa</p>
        <div className="backup-actions">
          <button className="backup-btn">Utwórz kopię zapasową</button>
          <button className="export-btn">Eksportuj do Excel</button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationSettings;