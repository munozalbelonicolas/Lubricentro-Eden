/**
 * Formatea un número como moneda argentina (ARS).
 */
export const formatPrice = (amount) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);

/**
 * Formatea una fecha en español.
 */
export const formatDate = (date) =>
  new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Formatea fecha y hora.
 */
export const formatDateTime = (date) =>
  new Date(date).toLocaleString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/**
 * Trunca texto a N caracteres.
 */
export const truncate = (str, n = 80) =>
  str && str.length > n ? str.slice(0, n) + '…' : str;

/**
 * Retorna la URL completa de una imagen del backend.
 */
export const getImageUrl = (path) => {
  if (!path) return '/placeholder-product.png';
  if (path.startsWith('http')) return path;
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  return `${base}${path}`;
};

/**
 * Etiquetas de estado de pago.
 */
export const paymentStatusLabel = {
  pending:    { label: 'Pendiente',   class: 'badge-warning' },
  approved:   { label: 'Aprobado',    class: 'badge-success' },
  rejected:   { label: 'Rechazado',   class: 'badge-error'   },
  in_process: { label: 'En proceso',  class: 'badge-neutral' },
  refunded:   { label: 'Reembolsado', class: 'badge-neutral' },
};

/**
 * Etiquetas de estado de orden.
 */
export const orderStatusLabel = {
  pending:       { label: 'Pendiente',      class: 'badge-warning' },
  confirmed:     { label: 'Confirmada',     class: 'badge-success' },
  processing:    { label: 'Procesando',     class: 'badge-neutral' },
  shipped:       { label: 'Enviada',        class: 'badge-primary' },
  ready_pickup:  { label: 'Listo retiro',   class: 'badge-primary' },
  delivered:     { label: 'Entregada',      class: 'badge-success' },
  cancelled:     { label: 'Cancelada',      class: 'badge-error'   },
};

/**
 * Etiquetas de tipo de entrega.
 */
export const deliveryTypeLabel = {
  shipping: { label: 'Envío a domicilio', icon: '🚚', class: 'badge-primary' },
  pickup:   { label: 'Retiro en tienda',  icon: '📦', class: 'badge-neutral' },
  workshop: { label: 'Cambio en taller',  icon: '🔧', class: 'badge-warning' },
};

/**
 * Etiquetas de categoría.
 */
export const categoryLabel = {
  aceite:      'Aceite',
  filtro:      'Filtro',
  aditivo:     'Aditivo',
  lubricante:  'Lubricante',
  repuesto:    'Repuesto',
  herramienta: 'Herramienta',
  otro:        'Otro',
};
