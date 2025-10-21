// src/models/MagazineItem.js
export const MAGAZINE_CATEGORIES = {
  GRAINS: 'zboża',
  MILK: 'mleko',
  FEED: 'pasze',
  FERTILIZERS: 'nawozy',
  SEEDS: 'nasiona',
  TOOLS: 'narzędzia',
  OTHER: 'inne'
}

export class MagazineItem {
  constructor(
    id = '',
    name = '',
    category = '',
    quantity = 0,
    unit = '',
    minQuantity = 0,
    location = '',
    supplier = '',
    purchaseDate = '',
    expirationDate = '',
    price = 0,
    notes = '',
    createdAt = new Date(),
    updatedAt = new Date()
  ) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.quantity = quantity;
    this.unit = unit;
    this.minQuantity = minQuantity;
    this.location = location;
    this.supplier = supplier;
    this.purchaseDate = purchaseDate;
    this.expirationDate = expirationDate;
    this.price = price;
    this.notes = notes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}