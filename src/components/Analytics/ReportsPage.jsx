import React from 'react';
import ProductionReports from './ProductionReports';
import './ReportsPage.css';

const ReportsPage = () => {
  // Funkcje formatujące
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  return (
    <div className="reports-page">
      <h1>Raporty</h1>
      <ProductionReports 
        formatCurrency={formatCurrency}
        formatNumber={formatNumber}
        formatPercentage={formatPercentage}
      />
    </div>
  );
};

export default ReportsPage;