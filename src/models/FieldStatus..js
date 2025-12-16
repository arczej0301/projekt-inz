export class FieldStatus {
  constructor(data) {
    this.id = data.id || '';
    this.field_id = data.field_id || '';
    this.status = data.status || '';
    this.crop = data.crop || '';
    this.notes = data.notes || '';
    this.date_created = data.date_created?.toDate ? 
      data.date_created.toDate() : 
      new Date(data.date_created);
    this.date_updated = data.date_updated?.toDate ? 
      data.date_updated.toDate() : 
      new Date(data.date_updated);
  }

  static getStatusOptions() {
    return [
      { value: 'sown', label: 'Zasiane' },
      { value: 'harvested', label: 'Zebrane' },
      { value: 'ready_for_sowing', label: 'Przygotowane do siewu' },
      { value: 'fallow', label: 'Ugór' },
      { value: 'pasture', label: 'Pastwisko/Łąka' }
    ];
  }

  static getStatusLabel(statusValue) {
    const statuses = this.getStatusOptions();
    const status = statuses.find(s => s.value === statusValue);
    return status ? status.label : statusValue;
  }

  static getStatusColor(statusValue) {
    const statusColors = {
      'sown': '#27ae60',
      'harvested': '#e74c3c',
      'ready_for_sowing': '#3498db',
      'fallow': '#f39c12',
      'pasture': '#2ecc71',
      'default': '#95a5a6'
    };
    return statusColors[statusValue] || statusColors['default'];
  }
}