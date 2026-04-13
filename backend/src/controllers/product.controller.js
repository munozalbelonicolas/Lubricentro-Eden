'use strict';

const Product = require('../models/Product.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * GET /api/products
 * Listar productos del tenant con filtros, búsqueda y paginación.
 */
const getProducts = catchAsync(async (req, res, next) => {
  const {
    category,
    brand,
    viscosity,
    vehicleCompatibility,
    search,
    minPrice,
    maxPrice,
    page = 1,
    limit = 20,
    sort = '-createdAt',
    featured,
  } = req.query;

  const filter = { tenantId: req.tenantId, isActive: true };

  // Escapar caracteres especiales de regex para evitar ReDoS
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (category) filter.category = category;
  if (brand) filter.brand = new RegExp(escapeRegex(brand), 'i');
  if (viscosity) filter.viscosity = new RegExp(escapeRegex(viscosity), 'i');
  if (vehicleCompatibility) filter.vehicleCompatibility = { $in: [vehicleCompatibility] };
  if (featured === 'true') filter.featured = true;

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { name: new RegExp(safeSearch, 'i') },
      { description: new RegExp(safeSearch, 'i') },
      { brand: new RegExp(safeSearch, 'i') },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  sendSuccess(res, { products }, 200, {
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * GET /api/products/:id
 */
const getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!product) return next(new AppError('Producto no encontrado.', 404));
  sendSuccess(res, { product });
});

/**
 * POST /api/products
 * Crear producto (admin). Requiere checkProductLimit middleware.
 */
const createProduct = catchAsync(async (req, res, next) => {
  const {
    name, description, category, brand, price, stock, viscosity,
    vehicleCompatibility, capacity, sku, featured, providerPrice, profitMargin,
  } = req.body;

  if (!name || !category || price === undefined) {
    return next(new AppError('name, category y price son obligatorios.', 400));
  }

  // Imágenes subidas
  const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

  const product = await Product.create({
    tenantId: req.tenantId,
    name,
    description,
    category,
    brand,
    price: Number(price),
    stock: Number(stock) || 0,
    viscosity,
    vehicleCompatibility: Array.isArray(vehicleCompatibility)
      ? vehicleCompatibility
      : vehicleCompatibility
      ? [vehicleCompatibility]
      : [],
    capacity,
    sku,
    featured: featured === 'true' || featured === true,
    images,
    providerPrice: Number(providerPrice) || 0,
    profitMargin: Number(profitMargin) || 0,
  });

  sendSuccess(res, { product }, 201);
});

/**
 * PUT /api/products/:id
 */
const updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!product) return next(new AppError('Producto no encontrado.', 404));

  const allowedFields = [
    'name', 'description', 'category', 'brand', 'price', 'stock',
    'viscosity', 'vehicleCompatibility', 'capacity', 'sku', 'featured', 'isActive',
    'providerPrice', 'profitMargin',
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  // Si se subieron nuevas imágenes, añadirlas
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((f) => `/uploads/${f.filename}`);
    product.images = [...product.images, ...newImages];
  }

  await product.save();
  sendSuccess(res, { product });
});

/**
 * DELETE /api/products/:id
 * Soft delete (isActive = false).
 */
const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!product) return next(new AppError('Producto no encontrado.', 404));

  product.isActive = false;
  await product.save();
  sendSuccess(res, null, 204);
});

/**
 * DELETE /api/products/:id/images/:imageIndex
 * Eliminar una imagen específica de un producto.
 */
const deleteProductImage = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!product) return next(new AppError('Producto no encontrado.', 404));

  const index = parseInt(req.params.imageIndex, 10);
  if (index < 0 || index >= product.images.length) {
    return next(new AppError('Índice de imagen inválido.', 400));
  }

  product.images.splice(index, 1);
  await product.save();
  sendSuccess(res, { product });
});

/**
 * GET /api/products/brands
 * Obtener marcas disponibles del tenant.
 */
const getBrands = catchAsync(async (req, res, next) => {
  const brands = await Product.distinct('brand', { tenantId: req.tenantId, isActive: true });
  sendSuccess(res, { brands: brands.filter(Boolean).sort() });
});

/**
 * GET /api/products/slug/:slug
 */
const getProductBySlug = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug, tenantId: req.tenantId });
  if (!product) return next(new AppError('Producto no encontrado.', 404));
  sendSuccess(res, { product });
});

module.exports = {
  getProducts,
  getProduct,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  getBrands,
  bulkUpdateMargin: catchAsync(async (req, res, next) => {
    const { profitMargin } = req.body;
    if (profitMargin === undefined) return next(new AppError('El margen de ganancia es obligatorio.', 400));

    const margin = Number(profitMargin);
    const products = await Product.find({ tenantId: req.tenantId, isActive: true });

    const updates = products.map(p => {
      const newPrice = p.providerPrice * (1 + margin / 100);
      return Product.updateOne(
        { _id: p._id },
        { 
          $set: { 
            profitMargin: margin,
            price: Math.round(newPrice) 
          } 
        }
      );
    });

    await Promise.all(updates);

    sendSuccess(res, { message: `Se actualizaron ${updates.length} productos con un margen del ${margin}%.` });
  }),
};
