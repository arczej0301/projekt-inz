// 📁 hooks/useEfficiency.js
import { useState, useCallback } from 'react';
import AnalyticsService from '../services/analyticsService';

export const useEfficiency = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [calculations, setCalculations] = useState({});

  // Oblicz wydajność pola
  const calculateFieldEfficiency = useCallback(async (fieldId, period = 'current') => {
    setLoading(true);
    setError(null);
    
    try {
      const efficiency = await AnalyticsService.calculateFieldEfficiency(fieldId, period);
      
      // Zapisz w stanie
      setCalculations(prev => ({
        ...prev,
        [fieldId]: {
          ...efficiency,
          lastCalculated: new Date().toISOString()
        }
      }));
      
      return efficiency;
    } catch (err) {
      setError(err.message);
      console.error('Error in calculateFieldEfficiency:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Oblicz wydajność wielu pól
  const calculateMultipleFields = useCallback(async (fieldIds, period = 'current') => {
    setLoading(true);
    setError(null);
    
    try {
      const results = {};
      
      // Oblicz dla każdego pola równolegle
      await Promise.all(
        fieldIds.map(async (fieldId) => {
          try {
            const efficiency = await AnalyticsService.calculateFieldEfficiency(fieldId, period);
            results[fieldId] = efficiency;
          } catch (err) {
            results[fieldId] = {
              error: err.message,
              score: 0,
              status: 'błąd obliczeń'
            };
          }
        })
      );
      
      setCalculations(prev => ({
        ...prev,
        ...results
      }));
      
      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Pobierz historię obliczeń
  const getEfficiencyHistory = useCallback(async (fieldId) => {
    setLoading(true);
    try {
      const history = await AnalyticsService.getEfficiencyHistory(fieldId);
      return history;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Pobierz wydajność z cache'a jeśli istnieje
  const getCachedEfficiency = useCallback((fieldId) => {
    return calculations[fieldId];
  }, [calculations]);

  // Wyczyść cache dla pola
  const clearCache = useCallback((fieldId) => {
    setCalculations(prev => {
      const newCalculations = { ...prev };
      delete newCalculations[fieldId];
      return newCalculations;
    });
  }, []);

  return {
    loading,
    error,
    calculations,
    calculateFieldEfficiency,
    calculateMultipleFields,
    getEfficiencyHistory,
    getCachedEfficiency,
    clearCache
  };
};