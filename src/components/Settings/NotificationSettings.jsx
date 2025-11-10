import React, { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import './NotificationSettings.css';

const NotificationSettings = () => {
  const { notificationSettings, saveNotificationSettings, loading } = useSettings();
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    financialAlerts: true,
    taskReminders: true,
    reportAlerts: false,
    lowStockAlerts: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Załaduj ustawienia powiadomień
  useEffect(() => {
    if (notificationSettings) {
      setNotifications(notificationSettings);
    }
  }, [notificationSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const result = await saveNotificationSettings(notifications);
    
    if (result.success) {
      setMessage('Ustawienia powiadomień zostały zapisane!');
    } else {
      setMessage(`Błąd: ${result.error}`);
    }
    
    setSaving(false);
  };

  const handleToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) {
    return <div className="loading">Ładowanie ustawień powiadomień...</div>;
  }

  return (
    <div className="notification-settings">
      <h2>Ustawienia Powiadomień</h2>
      
      {message && (
        <div className={`message ${message.includes('Błąd') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      
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

        <button type="submit" className="save-btn" disabled={saving}>
          {saving ? 'Zapisywanie...' : 'Zapisz ustawienia'}
        </button>
      </form>
    </div>
  );
};

export default NotificationSettings;