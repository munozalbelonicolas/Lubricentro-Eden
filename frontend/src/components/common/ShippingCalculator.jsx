import { useState, useCallback } from 'react';
import {
  FiTruck, FiMapPin, FiClock, FiCheckCircle,
  FiGift, FiAlertCircle, FiPackage, FiLoader,
} from 'react-icons/fi';
import api from '../../services/api';
import { formatPrice } from '../../utils/formatters';
import styles from './ShippingCalculator.module.css';

/**
 * ShippingCalculator
 *
 * Props:
 *   totalPrice     {number}  — total del carrito (para evaluar envío gratis)
 *   weightGrams?   {number}  — peso estimado en gramos (default 1000)
 *   onSelectOption {fn}      — callback({ type: 'shipping'|'pickup', cost, days, sucursal? })
 *   selectedType?  {string}  — 'shipping' | 'pickup' | null
 */
export default function ShippingCalculator({
  totalPrice     = 0,
  weightGrams    = 1000,
  onSelectOption = () => {},
  selectedType   = null,
}) {
  const [cp, setCp]               = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');
  const [selected, setSelected]   = useState(selectedType);

  const handleCalculate = useCallback(async (e) => {
    if (e) e.preventDefault();
    const cleanCp = cp.trim().replace(/\D/g, '');
    if (!cleanCp || cleanCp.length < 4) {
      setError('Ingresá un código postal válido (4 dígitos mínimo).');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data } = await api.post('/shipping/quote', {
        cpDestino:      cleanCp,
        pesoGramos:     weightGrams,
        valorDeclarado: totalPrice,
      });

      setResult(data.data);
    } catch (err) {
      setError(
        err?.message ||
        err?.response?.data?.message ||
        'No pudimos calcular el envío. Verificá el código postal.'
      );
    } finally {
      setLoading(false);
    }
  }, [cp, weightGrams, totalPrice]);

  const handleSelect = (type) => {
    if (!result) return;
    const option = type === 'shipping' ? result.shipping : result.pickup;
    setSelected(type);
    onSelectOption({
      type,
      cost:     option.precio,
      days:     option.diasHabil,
      servicio: option.servicio,
      cp,
    });
  };

  const freeLeft = result ? Math.max(0, result.freeThreshold - totalPrice) : 0;
  const freeThreshold = result?.freeThreshold;

  return (
    <div className={styles.wrapper}>
      {/* ── Encabezado ── */}
      <div className={styles.header}>
        <FiTruck className={styles.headerIcon} />
        <div>
          <p className={styles.headerTitle}>Calculá el costo de envío</p>
          <p className={styles.headerSub}>Ingresá tu código postal para ver las opciones</p>
        </div>
      </div>

      {/* ── Banner envío gratis ── */}
      {freeThreshold > 0 && (
        <div className={
          totalPrice >= freeThreshold
            ? `${styles.freeBanner} ${styles.freeBannerActive}`
            : styles.freeBanner
        }>
          <FiGift className={styles.freeIcon} />
          <div>
            {totalPrice >= freeThreshold ? (
              <p className={styles.freeText}>
                🎉 ¡Tiene <strong>envío gratis</strong> con tu compra!
              </p>
            ) : (
              <p className={styles.freeText}>
                Te faltan <strong>{formatPrice(freeLeft)}</strong> para{' '}
                <strong>envío gratis</strong>
              </p>
            )}
          </div>
          {totalPrice >= freeThreshold && (
            <span className={styles.freeBadge}>FREE</span>
          )}
        </div>
      )}

      {/* ── Formulario ── */}
      <form onSubmit={handleCalculate} className={styles.form}>
        <div className={styles.inputRow}>
          <div className={styles.cpInputWrap}>
            <FiMapPin className={styles.cpIcon} />
            <input
              type="text"
              id="shipping-cp"
              className={styles.cpInput}
              placeholder="Ej: 5000"
              value={cp}
              onChange={(e) => {
                setCp(e.target.value.replace(/\D/g, '').slice(0, 8));
                setError('');
                setResult(null);
              }}
              maxLength={8}
              inputMode="numeric"
            />
          </div>
          <button
            type="submit"
            className={styles.calcBtn}
            disabled={loading || !cp}
          >
            {loading
              ? <FiLoader className={styles.spinnerIcon} />
              : 'Calcular'
            }
          </button>
        </div>
        {error && (
          <p className={styles.errorMsg}>
            <FiAlertCircle size={14} /> {error}
          </p>
        )}
      </form>

      {/* ── Resultados ── */}
      {result && (
        <div className={styles.results}>

          {/* Opción 1: Envío a domicilio */}
          <button
            type="button"
            className={`${styles.optionCard} ${selected === 'shipping' ? styles.optionCardActive : ''}`}
            onClick={() => handleSelect('shipping')}
          >
            <div className={styles.optionLeft}>
              <div className={styles.optionIconWrap}>
                <FiTruck size={20} />
              </div>
              <div>
                <p className={styles.optionTitle}>Envío a domicilio</p>
                <p className={styles.optionService}>{result.shipping.servicio}</p>
                <div className={styles.optionMeta}>
                  <FiClock size={12} />
                  <span>
                    {result.isFreeShipping
                      ? `Llega en ${result.shipping.diasHabil} ${result.shipping.diasHabil === 1 ? 'día hábil' : 'días hábiles'}`
                      : `Llega en ${result.shipping.diasHabil} ${result.shipping.diasHabil === 1 ? 'día hábil' : 'días hábiles'}`
                    }
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.optionPrice}>
              {result.isFreeShipping ? (
                <>
                  <span className={styles.priceOld}>{formatPrice(result.shipping.precio || 0)}</span>
                  <span className={styles.priceFree}>GRATIS</span>
                </>
              ) : (
                <span className={styles.price}>{formatPrice(result.shipping.precio)}</span>
              )}
              {selected === 'shipping' && <FiCheckCircle className={styles.checkIcon} />}
            </div>
          </button>

          {/* Opción 2: Retiro en sucursal */}
          <button
            type="button"
            className={`${styles.optionCard} ${selected === 'pickup' ? styles.optionCardActive : ''}`}
            onClick={() => handleSelect('pickup')}
          >
            <div className={styles.optionLeft}>
              <div className={styles.optionIconWrap}>
                <FiPackage size={20} />
              </div>
              <div>
                <p className={styles.optionTitle}>Retiro en sucursal Andreani</p>
                <p className={styles.optionService}>{result.pickup.servicio}</p>
                <div className={styles.optionMeta}>
                  <FiClock size={12} />
                  <span>
                    {`Disponible en ${result.pickup.diasHabil} ${result.pickup.diasHabil === 1 ? 'día hábil' : 'días hábiles'}`}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.optionPrice}>
              <span className={styles.price}>{formatPrice(result.pickup.precio)}</span>
              <span className={styles.savingTag}>Ahorrás {formatPrice(result.shipping.precio - result.pickup.precio)}</span>
              {selected === 'pickup' && <FiCheckCircle className={styles.checkIcon} />}
            </div>
          </button>

          {/* Sucursales cercanas */}
          {result.sucursales?.length > 0 && (
            <div className={styles.branches}>
              <p className={styles.branchesTitle}>📍 Sucursales cercanas a {cp}:</p>
              {result.sucursales.map((s, i) => (
                <div key={i} className={styles.branchItem}>
                  <span className={styles.branchName}>{s.nombre || s.name}</span>
                  <span className={styles.branchAddr}>{s.domicilio || s.address || s.direccion}</span>
                </div>
              ))}
            </div>
          )}

          {/* Fuente de datos */}
          {result.source === 'fallback' && (
            <p className={styles.sourceNote}>
              * Tarifas estimadas. El costo final se confirma al procesar el pedido.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
