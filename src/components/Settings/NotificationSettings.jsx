import React, { useState } from 'react';

const NotificationSettings = () => {
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    financialAlerts: true,
    taskReminders: true,
    reportAlerts: false,
    lowStockAlerts: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    alert('Ustawienia powiadomień zostały zapisane!');
  };

  const handleToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="notification-settings">
      <h2>Ustawienia Powiadomień</h2>
      
      <form onSubmit={handleSave}>
        <div className="notification-group">
          <h3>Kanały powiadomień</h3>
          
          <div className="toggle-item">
            <label>Powiadomienia email</label>
            <input
              type="checkbox"
              checked={notifications.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
            />
          </div>

          <div className="toggle-item">
            <label>Powiadomienia SMS</label>
            <input
              type="checkbox"
              checked={notifications.smsNotifications}
              onChange={() => handleToggle('smsNotifications')}
            />
          </div>
        </div>

        <div className="notification-group">
          <h3>Typy powiadomień</h3>
          
          <div className="toggle-item">
            <label>Alerty finansowe</label>
            <input
              type="checkbox"
              checked={notifications.financialAlerts}
              onChange={() => handleToggle('financialAlerts')}
            />
          </div>

          <div className="toggle-item">
            <label>Przypomnienia o zadaniach</label>
            <input
              type="checkbox"
              checked={notifications.taskReminders}
              onChange={() => handleToggle('taskReminders')}
            />
          </div>

          <div className="toggle-item">
            <label>Raporty automatyczne</label>
            <input
              type="checkbox"
              checked={notifications.reportAlerts}
              onChange={() => handleToggle('reportAlerts')}
            />
          </div>

          <div className="toggle-item">
            <label>Alerty niskiego stanu magazynu</label>
            <input
              type="checkbox"
              checked={notifications.lowStockAlerts}
              onChange={() => handleToggle('lowStockAlerts')}
            />
          </div>
        </div>

        <button type="submit" className="save-btn">
          Zapisz ustawienia
        </button>
      </form>
    </div>
  );
};

export default NotificationSettings;