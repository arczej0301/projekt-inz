export class Field {
  constructor(data) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.area = parseFloat(data.area) || 0;
    this.soil = data.soil || '';
    this.crop = data.crop || '';
    this.notes = data.notes || '';
    this.coordinates = data.coordinates || [];
    this.createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
    this.updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
  }

  // Statyczne metody pomocnicze
  static getSoilTypes() {
    return [
      { value: 'gliniasta', label: 'Gliniasta' },
      { value: 'piaszczysta', label: 'Piaszczysta' },
      { value: 'ilasta', label: 'Ilasta' },
      { value: 'torfowa', label: 'Torfowa' },
      { value: 'mada', label: 'Mada rzeczna' }
    ];
  }

  static getSoilLabel(soilType) {
    const soils = this.getSoilTypes();
    const soil = soils.find(s => s.value === soilType);
    return soil ? soil.label : soilType;
  }
}