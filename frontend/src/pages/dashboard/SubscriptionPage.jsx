import { useState, useEffect } from 'react';
import { subscriptionService } from '../../services/index';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { FiCheck, FiZap } from 'react-icons/fi';
import styles from './SubscriptionPage.module.css';

export default function SubscriptionPage() {
  const [sub,     setSub]     = useState(null);
  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    Promise.all([subscriptionService.getMine(), subscriptionService.getPlans()])
      .then(([subData, plansData]) => {
        setSub(subData.data.subscription);
        setPlans(plansData.data.plans);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan) => {
    if (sub?.plan === plan) return;
    setUpgrading(true);
    try {
      const data = await subscriptionService.upgrade(plan);
      setSub(data.data.subscription);
      toast.success(`¡Plan ${plan.toUpperCase()} activado!`);
    } catch (err) {
      toast.error(err.message || 'Error al cambiar plan.');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) return <div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 className="section-title" style={{ marginBottom: '0.5rem' }}>Suscripción</h1>
        <p style={{ color: 'var(--color-text-2)', marginBottom: '2rem' }}>
          Plan actual: <strong style={{ color: 'var(--color-primary)' }}>{sub?.plan?.toUpperCase()}</strong>
          {sub?.endDate && ` — Vence el ${formatDate(sub.endDate)}`}
        </p>

        <div className={styles.grid}>
          {plans.map((plan) => {
            const isCurrent = sub?.plan === plan.id;
            const isPremium = plan.id === 'premium';
            return (
              <div key={plan.id} className={`${styles.planCard} ${isPremium ? styles.planPremium : ''} ${isCurrent ? styles.planCurrent : ''}`}>
                {isPremium && <div className={styles.popularBadge}><FiZap size={12} /> MÁS POPULAR</div>}
                {isCurrent && <div className={styles.currentBadge}>✓ PLAN ACTUAL</div>}
                <p className={styles.planName}>{plan.name}</p>
                <div className={styles.planPrice}>
                  <span className={styles.planAmount}>
                    {plan.price === 0 ? 'Gratis' : `$${plan.price.toLocaleString('es-AR')}`}
                  </span>
                  {plan.price > 0 && <span className={styles.planPeriod}>/mes</span>}
                </div>
                <p className={styles.planDesc}>{plan.description}</p>
                <ul className={styles.featureList}>
                  <li><FiCheck size={14} />
                    {plan.features.maxProducts === -1 ? 'Productos ilimitados' : `Hasta ${plan.features.maxProducts} productos`}
                  </li>
                  <li><FiCheck size={14} />
                    {plan.features.maxOrders === -1 ? 'Órdenes ilimitadas' : `Hasta ${plan.features.maxOrders} órdenes/mes`}
                  </li>
                  {plan.features.analytics   && <li><FiCheck size={14} /> Analytics avanzados</li>}
                  {plan.features.exportData  && <li><FiCheck size={14} /> Exportar datos</li>}
                  {plan.features.customDomain && <li><FiCheck size={14} /> Dominio personalizado</li>}
                  {plan.features.prioritySupport && <li><FiCheck size={14} /> Soporte prioritario</li>}
                </ul>
                <button
                  className={`btn btn-full ${isPremium ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || upgrading}
                >
                  {isCurrent ? '✓ Tu plan actual' : upgrading ? '...' : isPremium ? '🚀 Activar Premium' : 'Cambiar a Free'}
                </button>
              </div>
            );
          })}
        </div>

        {sub?.featuresEnabled && (
          <div className={styles.currentFeatures}>
            <p className={styles.currentFeaturesTitle}>Features habilitadas en tu plan</p>
            <div className={styles.featureGrid}>
              {Object.entries(sub.featuresEnabled).map(([key, value]) => (
                <div key={key} className={`${styles.featureItem} ${value ? styles.featureOn : styles.featureOff}`}>
                  {value ? '✓' : '✗'} {key}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
