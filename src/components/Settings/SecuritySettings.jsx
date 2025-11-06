import React, { useState } from 'react';

const SecuritySettings = () => {
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorAuth: false,
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert('Hasła nie są identyczne!');
      return;
    }
    alert('Ustawienia bezpieczeństwa zostały zaktualizowane!');
  };

  return (
    <div className="security-settings">
      <h2>Bezpieczeństwo</h2>
      
      <form onSubmit={handleSave} className="security-form">
        <div className="form-group">
          <label>Aktualne hasło</label>
          <input
            type="password"
            value={securityData.currentPassword}
            onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Nowe hasło</label>
          <input
            type="password"
            value={securityData.newPassword}
            onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Potwierdź nowe hasło</label>
          <input
            type="password"
            value={securityData.confirmPassword}
            onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
          />
        </div>

        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={securityData.twoFactorAuth}
              onChange={(e) => setSecurityData({...securityData, twoFactorAuth: e.target.checked})}
            />
            Włącz uwierzytelnianie dwuskładnikowe
          </label>
        </div>

        <button type="submit" className="save-btn">
          Zaktualizuj hasło
        </button>
      </form>

      <div className="security-info">
        <h3>Ostatnie logowania</h3>
        <div className="login-session">
          <span>📱 Chrome, Windows</span>
          <span>Dzisiaj, 14:30</span>
        </div>
        <div className="login-session">
          <span>📱 Safari, iPhone</span>
          <span>Wczoraj, 09:15</span>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;