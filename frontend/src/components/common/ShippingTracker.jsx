import { FiCheckCircle, FiPackage, FiTruck, FiHome, FiClock } from 'react-icons/fi';
import styles from './ShippingTracker.module.css';

/**
 * ShippingTracker — Timeline visual de seguimiento de envío para el cliente.
 *
 * Props:
 *   order       {object}  — documento de la orden (status, shippingStatus, trackingNumber, trackingCarrier)
 */

const CARRIERS = {
  andreani:  { name: 'Andreani',      url: (n) => `https://www.andreani.com/#!/informacionEnvio/${n}` },
  enviopack: { name: 'EnvioPack',     url: (n) => `https://enviopack.com/seguimiento?tracking=${n}` },
  correoarg: { name: 'Correo Arg.',   url: (n) => `https://www.correoargentino.com.ar/formularios/oidn?id=${n}` },
  oca:       { name: 'OCA',           url: (n) => `https://www.oca.com.ar/ocaepak/seguimientoenvio/?nroenvio=${n}` },
  otro:      { name: 'Carrier',       url: null },
};

const STEPS = [
  {
    key:   'confirmed',
    icon:  FiCheckCircle,
    label: 'Confirmado',
    sub:   'Tu pedido fue recibido y el pago aprobado.',
    // Activo cuando el pago fue aprobado (status !== 'pending' && !== 'cancelled')
    active: (order) => ['confirmed','processing','shipped','delivered'].includes(order.status),
  },
  {
    key:   'preparing',
    icon:  FiPackage,
    label: 'Preparando',
    sub:   'Jorge está preparando tu paquete para despacharlo.',
    active: (order) => ['processing','shipped','delivered'].includes(order.status) ||
                       ['preparing','dispatched','in_transit','delivered'].includes(order.shippingStatus),
  },
  {
    key:   'shipped',
    icon:  FiTruck,
    label: 'Despachado',
    sub:   'Tu paquete fue entregado al servicio de envío.',
    active: (order) => ['shipped','delivered'].includes(order.status) ||
                       ['dispatched','in_transit','delivered'].includes(order.shippingStatus),
  },
  {
    key:   'in_transit',
    icon:  FiClock,
    label: 'En camino',
    sub:   'Tu paquete está en tránsito hacia tu domicilio.',
    active: (order) => order.shippingStatus === 'in_transit' || order.shippingStatus === 'delivered' || order.status === 'delivered',
  },
  {
    key:   'delivered',
    icon:  FiHome,
    label: 'Entregado',
    sub:   '¡Tu paquete llegó!',
    active: (order) => order.status === 'delivered' || order.shippingStatus === 'delivered',
  },
];

export default function ShippingTracker({ order }) {
  if (!order || order.deliveryType !== 'shipping') return null;
  if (['pending', 'cancelled'].includes(order.status)) return null;

  const carrier = order.trackingCarrier ? CARRIERS[order.trackingCarrier] : null;
  const trackingUrl = carrier?.url && order.trackingNumber
    ? carrier.url(order.trackingNumber)
    : null;

  // Encontrar el último paso activo para marcar el "actual"
  let currentStepIdx = -1;
  STEPS.forEach((step, i) => {
    if (step.active(order)) currentStepIdx = i;
  });

  return (
    <div className={styles.wrapper}>
      <p className={styles.title}>📦 Seguimiento del envío</p>

      {/* Timeline */}
      <div className={styles.timeline}>
        {STEPS.map((step, i) => {
          const isActive  = step.active(order);
          const isCurrent = i === currentStepIdx;
          const Icon = step.icon;
          return (
            <div key={step.key} className={styles.step}>
              {/* Línea entre pasos */}
              {i < STEPS.length - 1 && (
                <div className={`${styles.line} ${isActive ? styles.lineActive : ''}`} />
              )}
              {/* Ícono */}
              <div className={`${styles.iconWrap} ${isActive ? styles.iconActive : ''} ${isCurrent ? styles.iconCurrent : ''}`}>
                <Icon size={16} />
                {isCurrent && <span className={styles.pulse} />}
              </div>
              {/* Texto */}
              <div className={styles.stepText}>
                <p className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : ''}`}>
                  {step.label}
                </p>
                {isCurrent && (
                  <p className={styles.stepSub}>{step.sub}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Número de seguimiento */}
      <div className={styles.trackingInfo}>
        {order.trackingNumber ? (
          <div className={styles.trackingRow}>
            <div>
              <p className={styles.trackingLabel}>
                {carrier ? carrier.name : 'Servicio de envío'}
              </p>
              <p className={styles.trackingNumber}>#{order.trackingNumber}</p>
            </div>
            {trackingUrl && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.trackBtn}
              >
                Rastrear envío →
              </a>
            )}
          </div>
        ) : (
          <p className={styles.trackingPending}>
            🕐 El número de seguimiento estará disponible cuando el paquete sea despachado.
          </p>
        )}
      </div>
    </div>
  );
}
