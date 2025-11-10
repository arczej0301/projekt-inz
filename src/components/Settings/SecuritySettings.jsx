import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './SecuritySettings.css';

const SecuritySettings = () => {
  const { changePassword } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changing, setChanging] = useState(false);
  const [message, setMessage] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChanging(true);
    setMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Hasła nie są identyczne!');
      setChanging(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage('Hasło musi mieć co najmniej 6 znaków!');
      setChanging(false);
      return;
    }

    const result = await changePassword(formData.currentPassword, formData.newPassword);
    
    if (result.success) {
      setMessage('Hasło zostało zmienione!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } else {
      setMessage(`Błąd: ${result.error}`);
    }
    
    setChanging(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="security-settings">
      <h2>Bezpieczeństwo</h2>
      
      {message && (
        <div className={`message ${message.includes('Błąd') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleChangePassword} className="security-form">
        <div className="form-group">
          <label>Aktualne hasło</label>
          <input
            type="password"
            value={formData.currentPassword}
            onChange={(e) => handleChange('currentPassword', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Nowe hasło</label>
          <input
            type="password"
            value={formData.newPassword}
            onChange={(e) => handleChange('newPassword', e.target.value)}
            required
            minLength="6"
          />
        </div>

        <div className="form-group">
          <label>Potwierdź nowe hasło</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            required
          />
        </div>

        <button type="submit" className="save-btn" disabled={changing}>
          {changing ? 'Zmienianie hasła...' : 'Zmień hasło'}
        </button>
      </form>
    </div>
  );
};

export default SecuritySettings;