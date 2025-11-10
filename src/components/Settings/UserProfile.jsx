import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './UserProfile.css';

const UserProfile = () => {
  const { user, userData, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    language: 'pl',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Załaduj dane użytkownika
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || user?.displayName || '',
        email: userData.email || user?.email || '',
        phone: userData.phone || '',
        position: userData.position || '',
        language: userData.language || 'pl',
      });
    }
  }, [userData, user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const result = await updateUserProfile(formData);
    
    if (result.success) {
      setMessage('Profil został zaktualizowany!');
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

  return (
    <div className="user-profile">
      <h2>Profil Użytkownika</h2>
      
      {message && (
        <div className={`message ${message.includes('Błąd') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSave} className="profile-form">
        <div className="form-group">
          <label>Imię i nazwisko</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Telefon</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Stanowisko</label>
          <input
            type="text"
            value={formData.position}
            onChange={(e) => handleChange('position', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Język</label>
          <select 
            value={formData.language}
            onChange={(e) => handleChange('language', e.target.value)}
          >
            <option value="pl">Polski</option>
            <option value="en">English</option>
          </select>
        </div>

        <button type="submit" className="save-btn" disabled={saving}>
          {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
        </button>
      </form>
    </div>
  );
};

export default UserProfile;