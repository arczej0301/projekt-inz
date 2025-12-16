import { useState, useEffect } from 'react';
import * as fieldsService from '../services/fieldsService';
import analyticsService from '../services/analyticsService'; // Użyj importu domyślnego

export const useFields = () => {
  const [fields, setFields] = useState([]);
  const [fieldStatuses, setFieldStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pobierz wszystkie pola
  const fetchFields = async () => {
    try {
      setLoading(true);
      const fieldsData = await fieldsService.getFields();
      setFields(fieldsData);
      
      // Pobierz statusy dla wszystkich pól
      const statuses = await fieldsService.getAllFieldStatuses();
      setFieldStatuses(statuses);
      
      return fieldsData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Generuj raport wydajności
  const generatePerformanceReport = async (startDate, endDate) => {
    try {
      // Użyj instancji analyticsService
      return await analyticsService.getFieldsPerformanceReport(null, startDate, endDate);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Generuj raport stanów
  const generateStatusReport = async () => {
    try {
      return await analyticsService.getFieldsStatusReport();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Pobierz ostatnie aktywności
  const getRecentActivities = async (limit = 10) => {
    try {
      return await analyticsService.getRecentFieldActivities(limit);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Oblicz wydajność pola
  const calculateFieldEfficiency = async (fieldId) => {
    try {
      return await analyticsService.calculateFieldEfficiency(fieldId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchFields();
    
    // Subskrybuj zmiany w polach
    const unsubscribeFields = fieldsService.subscribeToFields((fieldsData) => {
      setFields(fieldsData);
    });
    
    // Subskrybuj zmiany w statusach
    const unsubscribeStatuses = fieldsService.subscribeToFieldStatus((statuses) => {
      setFieldStatuses(statuses);
    });
    
    return () => {
      unsubscribeFields();
      unsubscribeStatuses();
    };
  }, []);

  return {
    fields,
    fieldStatuses,
    loading,
    error,
    
    // Funkcje operacyjne
    addField: fieldsService.addField,
    updateField: fieldsService.updateField,
    deleteField: fieldsService.deleteField,
    addFieldStatus: fieldsService.addFieldStatus,
    addFieldYield: fieldsService.addFieldYield,
    addFieldCost: fieldsService.addFieldCost,
    
    // Funkcje analityczne
    refreshFields: fetchFields,
    generatePerformanceReport,
    generateStatusReport,
    getRecentActivities,
    calculateFieldEfficiency,
    
    // Funkcje z fieldsService
    getFieldYields: fieldsService.getFieldYields,
    getFieldCosts: fieldsService.getFieldCosts,
    getFieldStatusHistory: fieldsService.getFieldStatusHistory,
    getCropPerformance: fieldsService.getCropPerformance,
    getFieldAnalytics: fieldsService.getFieldDetailedAnalytics
  };
};