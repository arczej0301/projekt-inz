import { useState, useEffect, useCallback } from 'react';
import { getAnimals } from '../services/animalsService';

// WAŻNE: Musi być 'export const', a nie samo 'const'
export const useAnimals = () => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Funkcja pobierająca dane
  const fetchAnimals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAnimals();
      setAnimals(data);
      setError(null);
    } catch (err) {
      console.error('Error in useAnimals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Funkcja generująca raporty (statystyki)
  const generateAnimalStats = useCallback(() => {
    if (!animals.length) return null;

    // 1. Podział na gatunki
    const speciesCount = animals.reduce((acc, animal) => {
      const type = animal.type || 'Inne';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // 2. Podział na statusy
    const statusCount = animals.reduce((acc, animal) => {
      const status = animal.status || 'Nieznany';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // 3. Łączna waga
    const totalWeight = animals.reduce((sum, animal) => sum + (Number(animal.weight) || 0), 0);

    return {
      totalAnimals: animals.length,
      speciesCount,
      statusCount,
      totalWeight,
      averageWeight: animals.length ? totalWeight / animals.length : 0
    };
  }, [animals]);

  // Pobierz dane przy pierwszym renderze
  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  return {
    animals,
    loading,
    error,
    refreshAnimals: fetchAnimals,
    generateAnimalStats
  };
};