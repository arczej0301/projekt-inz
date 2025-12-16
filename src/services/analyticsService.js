import { 
  db 
} from '../config/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit
} from 'firebase/firestore';

class AnalyticsService {
  // Raport wydajności pól
async getFieldsPerformanceReport(userId = null, startDate = null, endDate = null) {
  try {
    // 1. Pobierz wszystkie pola
    const fieldsQuery = query(collection(db, 'fields'));
    const fieldsSnapshot = await getDocs(fieldsQuery);
    const fields = fieldsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      area: parseFloat(doc.data().area) || 0,
      name: doc.data().name || 'Bez nazwy',
      soil: doc.data().soil || 'Brak danych'
    }));

    // 2. Pobierz wszystkie zbiory
    const yieldsRef = collection(db, 'field_yields');
    let yieldsQuery = query(yieldsRef, orderBy('date_created', 'desc'));
    
    const yieldsSnapshot = await getDocs(yieldsQuery);
    const yields = yieldsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      amount: parseFloat(doc.data().amount) || 0,
      date_created: doc.data().date_created,
      crop: doc.data().crop || ''
    }));

    // 3. Pobierz WSZYSTKIE statusy pól i znajdź najnowsze dla każdego pola
    const statusesRef = collection(db, 'field_status');
    const statusesQuery = query(statusesRef, orderBy('date_created', 'desc'));
    const statusesSnapshot = await getDocs(statusesQuery);
    
    // Mapowanie ID pola do jego najnowszego statusu
    const fieldCurrentStatus = {};
    statusesSnapshot.docs.forEach(doc => {
      const statusData = doc.data();
      const fieldId = statusData.field_id;
      
      // Jeśli jeszcze nie mamy statusu dla tego pola lub ten jest nowszy
      if (!fieldCurrentStatus[fieldId]) {
        fieldCurrentStatus[fieldId] = {
          status: statusData.status,
          crop: statusData.crop || '',
          date: statusData.date_created,
          notes: statusData.notes || ''
        };
      }
    });

    // 4. Przygotuj dane dla WSZYSTKICH pól (nawet bez zbiorów)
    const performanceData = fields.map(field => {
      // Znajdź zbiory dla tego pola
      const fieldYields = yields.filter(y => y.field_id === field.id);
      const totalYield = fieldYields.reduce((sum, y) => sum + y.amount, 0);
      const totalArea = field.area || 1;
      
      // Znajdź aktualny status pola
      const currentStatus = fieldCurrentStatus[field.id] || {};
      
      // Znajdź aktualną uprawę (ze statusu lub z pola)
      const currentCrop = currentStatus.crop || field.crop || 'Brak danych';
      
      // Tłumaczenie statusu na polski
      const statusMap = {
        'sown': 'Zasiane',
        'harvested': 'Zebrane',
        'ready_for_sowing': 'Przygotowane do siewu',
        'fallow': 'Ugór',
        'pasture': 'Pastwisko/Łąka',
        '': 'Brak danych',
        undefined: 'Brak danych',
        null: 'Brak danych'
      };
      
      const statusLabel = statusMap[currentStatus.status] || currentStatus.status || 'Brak danych';
      
      // Ostatni zbiór (jeśli istnieje)
      const lastHarvest = fieldYields.length > 0 ? fieldYields[0] : null;
      
      return {
        fieldId: field.id,
        fieldName: field.name,
        area: totalArea,
        crop: currentCrop,
        currentStatus: currentStatus.status || 'Brak danych',
        currentStatusLabel: statusLabel,
        statusDate: currentStatus.date || null,
        statusNotes: currentStatus.notes || '',
        totalYield,
        yieldPerHectare: totalArea > 0 ? totalYield / totalArea : 0,
        harvestCount: fieldYields.length,
        lastHarvestDate: lastHarvest?.date_created || null,
        lastHarvestAmount: lastHarvest?.amount || null,
        lastHarvestCrop: lastHarvest?.crop || null,
        soilType: field.soil || 'Brak danych',
        hasYields: fieldYields.length > 0,
        hasStatus: !!currentStatus.status
      };
    });

    // 5. Statystyki ogólne
    const totalArea = fields.reduce((sum, field) => sum + (field.area || 0), 0);
    const fieldsWithYields = performanceData.filter(f => f.hasYields);
    const totalYield = fieldsWithYields.reduce((sum, field) => sum + field.totalYield, 0);
    const averageYieldPerHectare = totalArea > 0 ? totalYield / totalArea : 0;

    // 6. Analiza według upraw (tylko dla pól z uprawą)
    const cropAnalysis = {};
    performanceData.forEach(field => {
      const crop = field.crop;
      if (crop && crop !== 'Brak danych') {
        if (!cropAnalysis[crop]) {
          cropAnalysis[crop] = {
            crop: crop,
            totalArea: 0,
            totalYield: 0,
            fieldCount: 0,
            averageYieldPerHectare: 0,
            fieldsWithYield: 0
          };
        }
        cropAnalysis[crop].totalArea += field.area;
        cropAnalysis[crop].totalYield += field.totalYield;
        cropAnalysis[crop].fieldCount += 1;
        if (field.hasYields) {
          cropAnalysis[crop].fieldsWithYield += 1;
        }
      }
    });

    // Oblicz średnie dla upraw
    Object.keys(cropAnalysis).forEach(crop => {
      const data = cropAnalysis[crop];
      data.averageYieldPerHectare = data.totalArea > 0 ? data.totalYield / data.totalArea : 0;
    });

    return {
      performanceData: performanceData, // WSZYSTKIE pola
      cropAnalysis: Object.values(cropAnalysis),
      summary: {
        totalFields: fields.length,
        totalArea,
        totalYield,
        averageYieldPerHectare: fieldsWithYields.length > 0 ? averageYieldPerHectare : 0,
        totalHarvests: yields.length,
        fieldsWithHarvest: fieldsWithYields.length,
        fieldsWithoutHarvest: fields.length - fieldsWithYields.length
      },
      fieldCurrentStatus: fieldCurrentStatus
    };
  } catch (error) {
    console.error('Error generating fields performance report:', error);
    throw error;
  }
}

  // Raport stanów pól
  async getFieldsStatusReport() {
    try {
      const fieldsRef = collection(db, 'fields');
      const fieldsQuery = query(fieldsRef);
      const fieldsSnapshot = await getDocs(fieldsQuery);
      const fields = fieldsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        area: parseFloat(doc.data().area) || 0
      }));

      // Pobierz najnowsze statusy dla każdego pola
      const statusesRef = collection(db, 'field_status');
      const statusesQuery = query(statusesRef);
      const statusesSnapshot = await getDocs(statusesQuery);
      
      // Mapowanie statusów na pola
      const fieldStatusMap = {};
      const statusHistory = {};
      
      statusesSnapshot.docs.forEach(doc => {
        const statusData = doc.data();
        const fieldId = statusData.field_id;
        const statusDate = statusData.date_created;
        
        // Znajdź najnowszy status dla pola
        if (!fieldStatusMap[fieldId] || new Date(statusDate) > new Date(fieldStatusMap[fieldId].date)) {
          fieldStatusMap[fieldId] = {
            status: statusData.status,
            crop: statusData.crop || '',
            date: statusDate
          };
        }
        
        // Historia zmian statusu
        if (!statusHistory[fieldId]) {
          statusHistory[fieldId] = [];
        }
        statusHistory[fieldId].push({
          status: statusData.status,
          date: statusDate,
          notes: statusData.notes || ''
        });
      });

      // Grupuj pola według stanu
      const statusCount = {};
      const areaByStatus = {};
      
      fields.forEach(field => {
        const status = fieldStatusMap[field.id]?.status || 'Brak danych';
        const area = field.area || 0;
        
        statusCount[status] = (statusCount[status] || 0) + 1;
        areaByStatus[status] = (areaByStatus[status] || 0) + area;
      });

      // Przygotuj listę pól z ich aktualnymi statusami
      const fieldsWithStatus = fields.map(field => ({
        id: field.id,
        name: field.name,
        area: field.area,
        crop: fieldStatusMap[field.id]?.crop || field.crop || '',
        soil: field.soil,
        currentStatus: fieldStatusMap[field.id]?.status || 'Brak danych',
        statusDate: fieldStatusMap[field.id]?.date || null,
        statusHistory: statusHistory[field.id] || []
      }));

      return {
        statusCount,
        areaByStatus,
        fieldsWithStatus,
        totalFields: fields.length,
        totalArea: fields.reduce((sum, field) => sum + (field.area || 0), 0)
      };
    } catch (error) {
      console.error('Error generating fields status report:', error);
      throw error;
    }
  }

  // Historia aktywności pól dla dashboardu
  async getRecentFieldActivities(limitCount = 10) {
    try {
      const activities = [];
      
      // 1. Pobierz ostatnie statusy
      const statusesRef = collection(db, 'field_status');
      const statusesQuery = query(
        statusesRef,
        orderBy('date_created', 'desc'),
        limit(limitCount)
      );
      const statusesSnapshot = await getDocs(statusesQuery);
      
      // Pobierz nazwy pól dla mapowania
      const fieldsRef = collection(db, 'fields');
      const fieldsSnapshot = await getDocs(fieldsRef);
      const fieldMap = {};
      fieldsSnapshot.docs.forEach(doc => {
        fieldMap[doc.id] = doc.data().name;
      });
      
      // Przetwórz statusy
      statusesSnapshot.docs.forEach(doc => {
        const statusData = doc.data();
        const fieldId = statusData.field_id;
        const fieldName = fieldMap[fieldId] || 'Nieznane pole';
        const date = statusData.date_created;
        
        // Mapowanie statusów na polskie nazwy
        const statusLabels = {
          'sown': 'Zasiane',
          'harvested': 'Zebrane',
          'ready_for_sowing': 'Przygotowane do siewu',
          'fallow': 'Ugór',
          'pasture': 'Pastwisko/Łąka'
        };
        
        const statusName = statusLabels[statusData.status] || statusData.status;
        const cropInfo = statusData.crop ? ` (${statusData.crop})` : '';
        
        activities.push({
          id: doc.id,
          type: 'status_change',
          title: `Zmiana statusu pola`,
          description: `${fieldName}${cropInfo} - ${statusName}`,
          details: statusData.notes || '',
          timestamp: new Date(date),
          fieldId: fieldId,
          fieldName: fieldName,
          status: statusData.status,
          crop: statusData.crop || ''
        });
      });
      
      // 2. Pobierz ostatnie zbiory
      const yieldsRef = collection(db, 'field_yields');
      const yieldsQuery = query(
        yieldsRef,
        orderBy('date_created', 'desc'),
        limit(Math.floor(limitCount / 2))
      );
      const yieldsSnapshot = await getDocs(yieldsQuery);
      
      yieldsSnapshot.docs.forEach(doc => {
        const yieldData = doc.data();
        const fieldId = yieldData.field_id;
        const fieldName = fieldMap[fieldId] || 'Nieznane pole';
        const date = yieldData.date_created;
        
        activities.push({
          id: doc.id,
          type: 'harvest',
          title: `Zbiór`,
          description: `${fieldName} - ${yieldData.crop || 'Uprawa'}: ${yieldData.amount || 0}t`,
          details: yieldData.moisture ? `Wilgotność: ${yieldData.moisture}%` : '',
          timestamp: new Date(date),
          fieldId: fieldId,
          fieldName: fieldName,
          crop: yieldData.crop || '',
          amount: yieldData.amount || 0
        });
      });
      
      // Posortuj wszystkie aktywności według daty
      activities.sort((a, b) => b.timestamp - a.timestamp);
      
      return activities.slice(0, limitCount);
      
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  // Funkcja do obliczania wydajności pojedynczego pola
  async calculateFieldEfficiency(fieldId) {
    try {
      // Pobierz dane pola
      const fieldsRef = collection(db, 'fields');
      const fieldsSnapshot = await getDocs(fieldsRef);
      const fieldDoc = fieldsSnapshot.docs.find(doc => doc.id === fieldId);
      
      if (!fieldDoc) {
        throw new Error('Pole nie istnieje');
      }
      
      const field = fieldDoc.data();
      field.id = fieldDoc.id;
      field.area = parseFloat(field.area) || 0;
      
      // Pobierz zbiory dla pola
      const yieldsRef = collection(db, 'field_yields');
      const yieldsQuery = query(
        yieldsRef,
        where('field_id', '==', fieldId)
      );
      const yieldsSnapshot = await getDocs(yieldsQuery);
      const yields = yieldsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        amount: parseFloat(doc.data().amount) || 0
      }));
      
      // Pobierz koszty dla pola
      const costsRef = collection(db, 'field_costs');
      const costsQuery = query(
        costsRef,
        where('field_id', '==', fieldId)
      );
      const costsSnapshot = await getDocs(costsQuery);
      const totalCost = costsSnapshot.docs.reduce((sum, doc) => {
        return sum + (parseFloat(doc.data().total_cost) || 0);
      }, 0);
      
      // Oblicz wskaźniki
      const totalYield = yields.reduce((sum, y) => sum + y.amount, 0);
      const averageYieldPerHectare = field.area > 0 ? totalYield / field.area : 0;
      const costPerHectare = field.area > 0 ? totalCost / field.area : 0;
      const profitPerHectare = averageYieldPerHectare - costPerHectare;
      
      // Benchmark dla uprawy
      const benchmarkYields = {
        'pszenica': 6.5,
        'kukurydza': 9.0,
        'rzepak': 4.0,
        'ziemniaki': 40.0,
        'buraki': 75.0
      };
      
      const crop = field.crop?.toLowerCase() || '';
      const benchmark = benchmarkYields[crop] || 5.0;
      const efficiencyRatio = benchmark > 0 ? (averageYieldPerHectare / benchmark) * 100 : 0;
      
      // Określ status wydajności
      let efficiencyStatus = 'niska';
      let efficiencyClass = 'low';
      
      if (efficiencyRatio >= 90) {
        efficiencyStatus = 'optymalna';
        efficiencyClass = 'high';
      } else if (efficiencyRatio >= 70) {
        efficiencyStatus = 'dobra';
        efficiencyClass = 'medium';
      } else if (efficiencyRatio >= 50) {
        efficiencyStatus = 'średnia';
        efficiencyClass = 'medium';
      }
      
      return {
        fieldId: field.id,
        fieldName: field.name,
        crop: field.crop || '',
        area: field.area,
        metrics: {
          totalYield,
          totalCost,
          averageYieldPerHectare,
          costPerHectare,
          profitPerHectare,
          benchmark,
          efficiencyRatio: Math.min(efficiencyRatio, 100)
        },
        status: {
          efficiencyStatus,
          efficiencyClass,
          score: Math.round(efficiencyRatio),
          lastUpdate: new Date().toISOString()
        },
        history: {
          yieldCount: yields.length,
          costCount: costsSnapshot.docs.length,
          lastHarvest: yields[0]?.date_created || null
        },
        recommendations: this.generateEfficiencyRecommendations(efficiencyRatio, averageYieldPerHectare, benchmark)
      };
      
    } catch (error) {
      console.error('Error calculating field efficiency:', error);
      throw error;
    }
  }
  
  generateEfficiencyRecommendations(efficiencyRatio, actualYield, benchmark) {
    const recommendations = [];
    
    if (efficiencyRatio < 70) {
      recommendations.push('Rozważ zmianę nawożenia lub poprawę jakości gleby');
      recommendations.push('Sprawdź terminy siewu i zbioru');
    }
    
    if (actualYield < benchmark * 0.8) {
      recommendations.push('Plon poniżej benchmarku dla tej uprawy');
      recommendations.push('Przeanalizuj warunki glebowe i agrotechnikę');
    }
    
    if (efficiencyRatio > 90) {
      recommendations.push('Wydajność optymalna - utrzymaj obecne praktyki');
    } else if (efficiencyRatio < 50) {
      recommendations.push('Zalecany przegląd agrotechniczny pola');
    }
    
    return recommendations;
  }
}

// Eksportuj instancję, a nie klasę
const analyticsService = new AnalyticsService();
export default analyticsService;