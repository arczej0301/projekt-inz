import { useState, useEffect, useCallback } from 'react';
import { getAnimals } from '../services/animalsService';

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

  // --- DODAJĘ NOWĄ FUNKCJĘ DO ANALIZY ZDROWIA ---
  const getHealthStats = useCallback(() => {
    if (!animals || animals.length === 0) {
      return {
        healthIndex: 100,
        commonIssues: [],
        healthDistribution: {
          'zdrowy': 0,
          'chory': 0,
          'w leczeniu': 0,
          'w kwarantannie': 0,
          'krytyczny': 0,
          'nieznany': 0
        },
        sickAnimalsList: []
      };
    }

    // Normalizacja statusów zdrowia (bezpiecznie przetwarzamy różne formaty)
    const normalizedAnimals = animals.map(animal => {
      let healthStatus = animal.health || 'nieznany';
      
      // Normalizacja różnych zapisów
      healthStatus = healthStatus.toLowerCase().trim();
      if (healthStatus.includes('zdrow') || healthStatus === 'healthy') return { ...animal, healthStatus: 'zdrowy' };
      if (healthStatus.includes('chor') || healthStatus === 'sick') return { ...animal, healthStatus: 'chory' };
      if (healthStatus.includes('leczen') || healthStatus.includes('leczeniu')) return { ...animal, healthStatus: 'w leczeniu' };
      if (healthStatus.includes('kwarantann') || healthStatus === 'quarantine') return { ...animal, healthStatus: 'w kwarantannie' };
      if (healthStatus.includes('krytycz') || healthStatus === 'critical') return { ...animal, healthStatus: 'krytyczny' };
      
      return { ...animal, healthStatus: 'nieznany' };
    });

    // Zliczanie zwierząt według statusu zdrowia
    const healthDistribution = {
      'zdrowy': 0,
      'chory': 0,
      'w leczeniu': 0,
      'w kwarantannie': 0,
      'krytyczny': 0,
      'nieznany': 0
    };

    normalizedAnimals.forEach(animal => {
      const healthStatus = animal.healthStatus;
      if (healthDistribution.hasOwnProperty(healthStatus)) {
        healthDistribution[healthStatus]++;
      }
    });

    // Obliczanie wskaźnika zdrowia (0-100%)
    const weights = {
      'zdrowy': 100,
      'chory': 40,
      'w leczeniu': 60,
      'w kwarantannie': 30,
      'krytyczny': 10,
      'nieznany': 50
    };

    let weightedSum = 0;
    Object.entries(healthDistribution).forEach(([status, count]) => {
      weightedSum += count * weights[status];
    });

    const totalAnimals = normalizedAnimals.length;
    const healthIndex = totalAnimals > 0 ? Math.round(weightedSum / totalAnimals) : 100;

    // Lista zwierząt z problemami zdrowotnymi
    const sickAnimalsList = normalizedAnimals
      .filter(animal => 
        animal.healthStatus === 'chory' || 
        animal.healthStatus === 'w leczeniu' || 
        animal.healthStatus === 'w kwarantannie' || 
        animal.healthStatus === 'krytyczny'
      )
      .map(animal => ({
        id: animal.id,
        name: animal.name || `Zwierzę ${animal.id}`,
        type: animal.type || 'nieznany',
        healthStatus: animal.healthStatus,
        originalHealth: animal.health,
        earTag: animal.earTag,
        breed: animal.breed,
        notes: animal.notes
      }));

    // Przygotowanie listy problemów zdrowotnych
    const commonIssues = [];
    
    if (healthDistribution['krytyczny'] > 0) {
      const criticalAnimals = sickAnimalsList.filter(a => a.healthStatus === 'krytyczny');
      commonIssues.push({
        issue: 'Zwierzęta w stanie krytycznym',
        count: healthDistribution['krytyczny'],
        severity: 'critical',
        animals: criticalAnimals
      });
    }
    
    if (healthDistribution['chory'] > 0) {
      const sickAnimals = sickAnimalsList.filter(a => a.healthStatus === 'chory');
      commonIssues.push({
        issue: 'Zwierzęta chore',
        count: healthDistribution['chory'],
        severity: 'high',
        animals: sickAnimals
      });
    }
    
    if (healthDistribution['w leczeniu'] > 0) {
      const treatingAnimals = sickAnimalsList.filter(a => a.healthStatus === 'w leczeniu');
      commonIssues.push({
        issue: 'Zwierzęta w trakcie leczenia',
        count: healthDistribution['w leczeniu'],
        severity: 'medium',
        animals: treatingAnimals
      });
    }

    if (healthDistribution['w kwarantannie'] > 0) {
      const quarantineAnimals = sickAnimalsList.filter(a => a.healthStatus === 'w kwarantannie');
      commonIssues.push({
        issue: 'Zwierzęta w kwarantannie',
        count: healthDistribution['w kwarantannie'],
        severity: 'medium',
        animals: quarantineAnimals
      });
    }

    return {
      healthIndex,
      commonIssues,
      healthDistribution,
      sickAnimalsList,
      totalAnimals: normalizedAnimals.length,
      sickAnimals: sickAnimalsList.length,
      lastUpdated: new Date()
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
    generateAnimalStats,
    getHealthStats // ← DODAŁEM TUTAJ
  };
};