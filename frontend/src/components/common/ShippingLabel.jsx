import { useRef } from 'react';
import { FiPrinter, FiX } from 'react-icons/fi';
import { formatDate } from '../../utils/formatters';
import styles from './ShippingLabel.module.css';

/**
 * ShippingLabel
 *
 * Props:
 *   order   {object}  — orden completa con `shipping`, `orderNumber`, `items`, `trackingNumber`
 *   onClose {fn}      — cierra el modal
 *
 * REMITENTE (constantes del negocio, configurables vía .env o props):
 *   senderName, senderAddress, senderCity, senderPhone
 */

const SENDER = {
  name:    import.meta.env.VITE_STORE_NAME    || 'Lubricentro Eden',
  address: import.meta.env.VITE_STORE_ADDRESS || 'Dirección del local',
  city:    import.meta.env.VITE_STORE_CITY    || 'Córdoba, Argentina',
  phone:   import.meta.env.VITE_STORE_PHONE   || '',
};

export default function ShippingLabel({ order, onClose }) {
  const labelRef = useRef(null);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Etiqueta-${order.orderNumber}`;
    window.print();
    document.title = originalTitle;
  };

  if (!order) return null;

  const { shipping = {}, orderNumber, items = [], trackingNumber = '' } = order;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const today = formatDate(new Date());

  return (
    <div className={styles.overlay}>
      {/* ── Controles (no se imprimen) ── */}
      <div className={styles.controls}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          <FiX size={16} /> Cerrar
        </button>
        <button className="btn btn-primary btn-sm" onClick={handlePrint}>
          <FiPrinter size={16} /> Imprimir etiqueta
        </button>
      </div>

      {/* ── Etiqueta ── */}
      <div className={styles.label} ref={labelRef} id="shipping-label">

        {/* Encabezado: N° de orden + fecha */}
        <div className={styles.labelHeader}>
          <div>
            <p className={styles.storeName}>{SENDER.name}</p>
            <p className={styles.labelDate}>{today}</p>
          </div>
          <div className={styles.orderBadge}>
            <p className={styles.orderBadgeLabel}>N° ORDEN</p>
            <p className={styles.orderBadgeNum}>#{orderNumber}</p>
          </div>
        </div>

        <div className={styles.labelBody}>
          {/* REMITENTE */}
          <div className={styles.addressBlock}>
            <p className={styles.addressRole}>DE (REMITENTE)</p>
            <p className={styles.addressName}>{SENDER.name}</p>
            <p className={styles.addressLine}>{SENDER.address}</p>
            <p className={styles.addressLine}>{SENDER.city}</p>
            {SENDER.phone && <p className={styles.addressLine}>Tel: {SENDER.phone}</p>}
          </div>

          <div className={styles.dividerV} />

          {/* DESTINATARIO */}
          <div className={styles.addressBlock}>
            <p className={styles.addressRole}>PARA (DESTINATARIO)</p>
            <p className={styles.addressName}>{shipping.name || '—'}</p>
            {shipping.address   && <p className={styles.addressLine}>{shipping.address}</p>}
            {(shipping.city || shipping.province) && (
              <p className={styles.addressLine}>
                {shipping.city}{shipping.province ? `, ${shipping.province}` : ''}
              </p>
            )}
            {shipping.postalCode && (
              <p className={styles.addressCP}>CP: <strong>{shipping.postalCode}</strong></p>
            )}
            {shipping.phone && <p className={styles.addressLine}>Tel: {shipping.phone}</p>}
          </div>
        </div>

        {/* Contenido del paquete */}
        <div className={styles.contents}>
          <p className={styles.contentsTitle}>CONTENIDO ({itemCount} {itemCount === 1 ? 'unidad' : 'unidades'})</p>
          <div className={styles.contentsList}>
            {items.slice(0, 5).map((item, i) => (
              <span key={i} className={styles.contentsItem}>
                {item.quantity}× {item.name}
              </span>
            ))}
            {items.length > 5 && <span className={styles.contentsItem}>…y {items.length - 5} más</span>}
          </div>
        </div>

        {/* Número de seguimiento */}
        <div className={styles.trackingSection}>
          <p className={styles.trackingLabel}>N° DE SEGUIMIENTO</p>
          {trackingNumber ? (
            <>
              <p className={styles.trackingNumLarge}>{trackingNumber}</p>
              {/* Representación visual del código */}
              <div className={styles.barcode} aria-hidden="true">
                {trackingNumber.split('').map((ch, i) => (
                  <span
                    key={i}
                    className={styles.bar}
                    style={{ width: (['1','3','5','7','9'].includes(ch) ? 2 : 1) + 'px' }}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className={styles.trackingBlank}>
              <p className={styles.trackingBlankNote}>Completar manualmente</p>
              <div className={styles.trackingWriteLine} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.labelFooter}>
          <p>Impreso: {today} · {SENDER.name} · Ecommerce Lubricentro</p>
        </div>
      </div>
    </div>
  );
}
