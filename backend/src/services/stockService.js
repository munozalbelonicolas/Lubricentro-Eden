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
    let totalValue = 0;

    for (const item of items) {
      if (!item.productId) continue;
      
      const product = await Product.findOneAndUpdate(
        { _id: item.productId, tenantId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!product) {
        console.warn(`Stock insuficiente para producto ${item.productId} o no encontrado.`);
        continue;
      }
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

    for (const item of items) {
      if (!item.productId) continue;
      
      await Product.findOneAndUpdate(
        { _id: item.productId, tenantId },
        { $inc: { stock: item.quantity } }
      );
    }
  }
}

module.exports = StockService;
