'use strict';
const Product = require('../models/Product.model');

/**
 * Servicio para gestionar operaciones de stock de forma centralizada.
 */
class StockService {
  /**
   * Descuenta stock de una lista de items.
   * @param {ObjectId} tenantId 
   * @param {Array} items [{ productId, quantity }]
   * @returns {Promise<number>} Valor total de los items descontados.
   */
  static async deductStock(tenantId, items) {
    if (!items || items.length === 0) return 0;
    
    // We cannot easily get the updated products via bulkWrite to calculate the true total
    // so we assume the provided item.price is correct (which is checked in checkout).
    
    const operations = items.filter(item => item.productId).map(item => ({
      updateOne: {
        filter: { _id: item.productId, tenantId, stock: { $gte: item.quantity } },
        update: { $inc: { stock: -item.quantity } }
      }
    }));

    if (operations.length === 0) return 0;

    await Product.bulkWrite(operations);

    let totalValue = 0;
    for (const item of items) {
       totalValue += item.price * item.quantity;
    }
    
    return totalValue;
  }

  /**
   * Restaura stock de una lista de items.
   * @param {ObjectId} tenantId 
   * @param {Array} items [{ productId, quantity }]
   */
  static async restoreStock(tenantId, items) {
    if (!items || items.length === 0) return;

    const operations = items.filter(item => item.productId).map(item => ({
      updateOne: {
        filter: { _id: item.productId, tenantId },
        update: { $inc: { stock: item.quantity } }
      }
    }));

    if (operations.length > 0) {
      await Product.bulkWrite(operations);
    }
  }
}

module.exports = StockService;
