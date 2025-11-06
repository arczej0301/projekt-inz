import React, { useState } from 'react';
import UserProfile from './UserProfile';
import CompanySettings from './CompanySettings';
import SecuritySettings from './SecuritySettings';
import NotificationSettings from './NotificationSettings';
import IntegrationSettings from './IntegrationSettings';
import './SettingsPage.css';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: '👤 Profil', component: UserProfile },
    { id: 'company', label: '🏢 Firma', component: CompanySettings },
    { id: 'security', label: '🔒 Bezpieczeństwo', component: SecuritySettings },
    { id: 'notifications', label: '🔔 Powiadomienia', component: NotificationSettings },
    { id: 'integrations', label: '🔗 Integracje', component: IntegrationSettings },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Ustawienia</h1>
        <p>Zarządzaj ustawieniami swojego konta i aplikacji</p>
      </div>
      
      <div className="settings-container">
        <div className="settings-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="settings-content">
          {ActiveComponent ? <ActiveComponent /> : <div>Wybierz sekcję ustawień</div>}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;