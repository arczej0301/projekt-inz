import { db } from '../config/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

class AnalyticsService {
  // Obliczanie wydajności pola
  static async calculateFieldEfficiency(fieldId, period = 'current') {
    try {
      // 1. Pobierz dane pola
      const fieldData = await this.getFieldData(fieldId);
      
      // 2. Pobierz pomiary dla pola
      const measurements = await this.getFieldMeasurements(fieldId, period);
      
      // 3. Oblicz wskaźniki
      const efficiency = this.calculateEfficiencyMetrics(fieldData, measurements);
      
      // 4. Zapisz wynik (opcjonalnie)
      await this.saveEfficiencyCalculation(fieldId, efficiency);
      
      return efficiency;
    } catch (error) {
      console.error('Error calculating field efficiency:', error);
      throw error;
    }
  }

  // Pobierz dane pola
  static async getFieldData(fieldId) {
    const fieldRef = db.collection('fields').doc(fieldId);
    const fieldDoc = await fieldRef.get();
    
    if (!fieldDoc.exists) {
      throw new Error('Pole nie istnieje');
    }
    
    return {
      id: fieldDoc.id,
      ...fieldDoc.data(),
      // Dane dodatkowe
      benchmarkYield: this.getCropBenchmark(fieldDoc.data().crop),
      expectedYield: this.getExpectedYield(fieldDoc.data().crop, fieldDoc.data().soilType)
    };
  }

  // Pobierz pomiary pola
  static async getFieldMeasurements(fieldId, period) {
    let q = db.collection('fieldMeasurements')
      .where('fieldId', '==', fieldId);
    
    // Filtruj po okresie
    if (period !== 'all') {
      const dateFilter = this.getDateRange(period);
      q = q.where('date', '>=', dateFilter.start)
          .where('date', '<=', dateFilter.end);
    }
    
    const snapshot = await q.orderBy('date', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Główne obliczenia wydajności
  static calculateEfficiencyMetrics(fieldData, measurements) {
    if (!measurements || measurements.length === 0) {
      return {
        score: 0,
        status: 'brak danych',
        breakdown: {},
        recommendations: ['Brak danych pomiarowych']
      };
    }

    // Agreguj dane z pomiarów
    const aggregated = this.aggregateMeasurements(measurements);
    
    // Oblicz poszczególne wskaźniki
    const indicators = {
      yield: this.calculateYieldIndicator(aggregated.yield, fieldData.benchmarkYield),
      economic: this.calculateEconomicIndicator(aggregated.revenue, aggregated.costs, fieldData.area),
      quality: this.calculateQualityIndicator(aggregated.qualityParams),
      sustainability: this.calculateSustainabilityIndicator(aggregated.waterUsage, aggregated.fertilizerUsage)
    };

    // Wagi wskaźników
    const weights = {
      yield: 0.40,
      economic: 0.30,
      quality: 0.20,
      sustainability: 0.10
    };

    // Oblicz końcowy wynik
    const totalScore = Object.keys(indicators).reduce((sum, key) => {
      return sum + (indicators[key] * weights[key]);
    }, 0);

    // Określ status
    const status = this.getEfficiencyStatus(totalScore);
    
    // Generuj rekomendacje
    const recommendations = this.generateRecommendations(indicators, totalScore);

    return {
      score: Math.round(totalScore * 100) / 100, // Zaokrąglij do 2 miejsc
      status,
      indicators,
      breakdown: {
        weights,
        calculations: indicators
      },
      recommendations,
      lastUpdated: new Date().toISOString(),
      period: measurements.length > 0 ? {
        start: measurements[measurements.length - 1].date,
        end: measurements[0].date
      } : null
    };
  }

  // Wskaźnik plonu
  static calculateYieldIndicator(actualYield, benchmarkYield) {
    if (!benchmarkYield || benchmarkYield <= 0) return 0.5; // Średnia
    
    const ratio = actualYield / benchmarkYield;
    // Normalizuj do 0-1, gdzie 1 = 100% benchmarku
    return Math.min(Math.max(ratio, 0), 1);
  }

  // Wskaźnik ekonomiczny
  static calculateEconomicIndicator(revenue, costs, area) {
    if (area <= 0 || revenue <= 0) return 0.5;
    
    const profit = revenue - costs;
    const profitPerHectare = profit / area;
    
    // Benchmarki ekonomiczne dla różnych upraw
    const benchmarkProfit = this.getEconomicBenchmark(area);
    
    if (benchmarkProfit <= 0) return 0.5;
    
    const ratio = profitPerHectare / benchmarkProfit;
    return Math.min(Math.max(ratio, 0), 1);
  }

  // Wskaźnik jakości
  static calculateQualityIndicator(qualityParams = {}) {
    const defaults = {
      protein: 12,    // % dla zbóż
      moisture: 14,   // % wilgotności
      impurities: 1,  // % zanieczyszczeń
      uniformity: 85  // % jednolitości
    };
    
    const params = { ...defaults, ...qualityParams };
    
    // Normalizuj każdy parametr
    const scores = {
      protein: this.normalize(params.protein, 8, 15),      // 8-15% = dobre
      moisture: this.normalizeInverse(params.moisture, 12, 20), // mniej = lepiej
      impurities: this.normalizeInverse(params.impurities, 0, 5),
      uniformity: this.normalize(params.uniformity, 70, 95)
    };
    
    // Ważona suma
    const weights = { protein: 0.4, moisture: 0.3, impurities: 0.2, uniformity: 0.1 };
    return Object.keys(scores).reduce((sum, key) => 
      sum + (scores[key] * weights[key]), 0
    );
  }

  // Wskaźnik zrównoważenia
  static calculateSustainabilityIndicator(waterUsage, fertilizerUsage) {
    // Benchmarki dla 1 ha
    const waterBenchmark = 300;    // m3/ha/rok
    const fertilizerBenchmark = 150; // kg N/ha/rok
    
    const waterScore = this.normalizeInverse(waterUsage, 0, waterBenchmark * 2);
    const fertilizerScore = this.normalizeInverse(fertilizerUsage, 0, fertilizerBenchmark * 2);
    
    return (waterScore * 0.6 + fertilizerScore * 0.4);
  }

  // Pomocnicze funkcje
  static normalize(value, min, max) {
    if (max <= min) return 0.5;
    return Math.min(Math.max((value - min) / (max - min), 0), 1);
  }

  static normalizeInverse(value, min, max) {
    return 1 - this.normalize(value, min, max);
  }

  static aggregateMeasurements(measurements) {
    return measurements.reduce((acc, measurement) => ({
      yield: acc.yield + (measurement.yield || 0),
      revenue: acc.revenue + (measurement.revenue || 0),
      costs: acc.costs + (measurement.costs || 0),
      waterUsage: acc.waterUsage + (measurement.waterUsage || 0),
      fertilizerUsage: acc.fertilizerUsage + (measurement.fertilizerUsage || 0),
      qualityParams: this.mergeQualityParams(acc.qualityParams, measurement.qualityParams)
    }), {
      yield: 0,
      revenue: 0,
      costs: 0,
      waterUsage: 0,
      fertilizerUsage: 0,
      qualityParams: {}
    });
  }

  static mergeQualityParams(existing, newParams) {
    if (!newParams) return existing;
    
    // Średnia ważona z istniejących parametrów
    const merged = { ...existing };
    Object.keys(newParams).forEach(key => {
      if (merged[key] !== undefined) {
        merged[key] = (merged[key] + newParams[key]) / 2;
      } else {
        merged[key] = newParams[key];
      }
    });
    
    return merged;
  }

  static getEfficiencyStatus(score) {
    if (score >= 0.8) return 'optymalna';
    if (score >= 0.6) return 'dobra';
    if (score >= 0.4) return 'średnia';
    return 'wymaga uwagi';
  }

  static generateRecommendations(indicators, totalScore) {
    const recommendations = [];
    
    if (indicators.yield < 0.6) {
      recommendations.push('Rozważ zmianę nawożenia lub poprawę jakości gleby');
    }
    
    if (indicators.economic < 0.5) {
      recommendations.push('Przeanalizuj koszty produkcji - możliwe oszczędności');
    }
    
    if (indicators.sustainability < 0.4) {
      recommendations.push('Zmniejsz zużycie wody i nawozów dla lepszej efektywności');
    }
    
    if (totalScore < 0.5) {
      recommendations.push('Zalecany przegląd agrotechniczny pola');
    }
    
    return recommendations;
  }

  // Benchmarki (mogą być z bazy danych)
  static getCropBenchmark(cropType) {
    const benchmarks = {
      'pszenica': 6.5,    // t/ha
      'kukurydza': 9.0,
      'rzepak': 4.0,
      'buraki': 75.0,
      'ziemniaki': 40.0
    };
    return benchmarks[cropType?.toLowerCase()] || 5.0;
  }

  static getExpectedYield(cropType, soilType) {
    // Uwzględnia typ gleby
    const baseYield = this.getCropBenchmark(cropType);
    const soilMultiplier = {
      'gliniasta': 1.1,
      'piaszczysta': 0.8,
      'torfowa': 0.9,
      'czarnoziem': 1.2
    }[soilType] || 1.0;
    
    return baseYield * soilMultiplier;
  }

  static getEconomicBenchmark(area) {
    // Średni zysk na ha dla gospodarstwa
    return area * 2500; // przykładowo 2500 zł/ha
  }

  static getDateRange(period) {
    const now = new Date();
    const ranges = {
      'current': { 
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now
      },
      'last30': {
        start: new Date(now.setDate(now.getDate() - 30)),
        end: new Date()
      },
      'quarter': {
        start: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1),
        end: now
      },
      'year': {
        start: new Date(now.getFullYear(), 0, 1),
        end: now
      }
    };
    
    return ranges[period] || ranges.current;
  }

  // Zapisz obliczenia do Firestore
  static async saveEfficiencyCalculation(fieldId, efficiencyData) {
    try {
      const calculationRef = db.collection('efficiencyCalculations').doc();
      await calculationRef.set({
        fieldId,
        ...efficiencyData,
        calculatedAt: new Date().toISOString()
      });
      
      // Aktualizuj też pole z ostatnią wydajnością
      const fieldRef = db.collection('fields').doc(fieldId);
      await fieldRef.update({
        lastEfficiency: efficiencyData.score,
        lastEfficiencyUpdate: new Date().toISOString(),
        efficiencyStatus: efficiencyData.status
      });
      
      return calculationRef.id;
    } catch (error) {
      console.error('Error saving efficiency calculation:', error);
    }
  }

  // Pobierz historię obliczeń
  static async getEfficiencyHistory(fieldId, limit = 10) {
    const q = db.collection('efficiencyCalculations')
      .where('fieldId', '==', fieldId)
      .orderBy('calculatedAt', 'desc')
      .limit(limit);
    
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

export default AnalyticsService;