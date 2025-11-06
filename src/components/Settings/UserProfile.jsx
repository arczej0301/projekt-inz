import React, { useState } from 'react';
import './UserProfile.css';

const UserProfile = () => {
  const [userData, setUserData] = useState({
    name: 'Jan Kowalski',
    email: 'jan.kowalski@example.com',
    phone: '+48 123 456 789',
    position: 'Właściciel gospodarstwa',
    language: 'pl',
  });

  const handleSave = (e) => {
    e.preventDefault();
    // Tutaj logika zapisu do Firebase/backendu
    alert('Zmiany zostały zapisane!');
  };

  return (
    <div className="user-profile">
      <h2>Profil Użytkownika</h2>
      
      <form onSubmit={handleSave} className="profile-form">
        <div className="form-group">
          <label>Imię i nazwisko</label>
          <input
            type="text"
            value={userData.name}
            onChange={(e) => setUserData({...userData, name: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={userData.email}
            onChange={(e) => setUserData({...userData, email: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Telefon</label>
          <input
            type="tel"
            value={userData.phone}
            onChange={(e) => setUserData({...userData, phone: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Stanowisko</label>
          <input
            type="text"
            value={userData.position}
            onChange={(e) => setUserData({...userData, position: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Język</label>
          <select 
            value={userData.language}
            onChange={(e) => setUserData({...userData, language: e.target.value})}
          >
            <option value="pl">Polski</option>
            <option value="en">English</option>
          </select>
        </div>

        <button type="submit" className="save-btn">
          Zapisz zmiany
        </button>
      </form>
    </div>
  );
};

export default UserProfile;