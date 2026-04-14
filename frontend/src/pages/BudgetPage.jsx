import { useState, useEffect } from 'react';
import { productService } from '../services/product.service';
import { formatPrice } from '../utils/formatters';
import { FiArrowRight, FiArrowLeft, FiDownload, FiCheckCircle } from 'react-icons/fi';
import SEOHead from '../components/seo/SEOHead';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 'aceite', label: 'Aceite', category: 'aceite' },
  { id: 'filtro_aceite', label: 'Filtro Aceite', category: 'filtro' },
  { id: 'filtro_aire', label: 'Filtro Aire', category: 'filtro' },
  { id: 'filtro_habitaculo', label: 'Filtro Habitáculo', category: 'filtro' },
];

export default function BudgetPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [search, setSearch] = useState('');

  const step = STEPS[currentStep];

  useEffect(() => {
    loadProducts();
  }, [currentStep]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Intentamos cargar por categoría
      const data = await productService.getAll({ 
        category: step.category, 
        limit: 100 
      });
      
      let filtered = data.data.products || [];
      
      // Lógica de filtrado por palabras clave para ser más precisos con los tipos de filtros
      if (step.id !== 'aceite') {
        const query = step.id === 'filtro_aire' ? 'aire' : 
                      step.id === 'filtro_habitaculo' ? 'habitaculo' : 'aceite';
        
        if (query === 'aire') {
          filtered = filtered.filter(p => p.name.toLowerCase().includes('aire'));
        } else if (query === 'habitaculo') {
          filtered = filtered.filter(p => p.name.toLowerCase().includes('habitaculo') || p.name.toLowerCase().includes('cabina'));
        } else {
          // Filtro de aceite: excluimos los otros dos tipos para mayor precisión
          filtered = filtered.filter(p => !p.name.toLowerCase().includes('aire') && !p.name.toLowerCase().includes('habitaculo'));
        }
      }
      
      setProducts(filtered);
    } catch (err) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (p) => {
    const newItems = [...selectedItems];
    newItems[currentStep] = p;
    setSelectedItems(newItems);
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setSearch('');
    }
  };

  const handleSkip = () => {
    const newItems = [...selectedItems];
    newItems[currentStep] = null;
    setSelectedItems(newItems);
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setSearch('');
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const items = selectedItems.filter(Boolean);
    const total = items.reduce((acc, curr) => acc + curr.price, 0);

    // Header decorativo
    doc.setFillColor(203, 26, 32); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('LUBRICENTRO EDÉN', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Presupuesto de Servicio Especializado', 105, 30, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, 14, 50);

    autoTable(doc, {
      startY: 60,
      head: [['Producto', 'Marca', 'Precio Unitario']],
      body: items.map(p => [
        p.name,
        p.brand || '-',
        formatPrice(p.price)
      ]),
      foot: [['', 'TOTAL ESTIMADO', formatPrice(total)]],
      theme: 'grid',
      headStyles: { fillStyle: [203, 26, 32] },
      footStyles: { fillStyle: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    const disclaimer = 'AVISO LEGAL: Este presupuesto está sujeto a disponibilidad de stock al momento de realizar el servicio técnico. Los valores pueden sufrir modificaciones sin previo aviso debido a la inflación, cambios en el tipo de cambio o ajustes en las listas de precios de los proveedores.';
    const splitText = doc.splitTextToSize(disclaimer, 180);
    doc.text(splitText, 14, finalY);

    doc.setFont('helvetica', 'bold');
    doc.text('Vigencia: 48 horas.', 14, finalY + 20);

    doc.save(`Presupuesto_Eden_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Presupuesto generado con éxito');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <SEOHead
        title="Generador de Presupuestos"
        description="Armá un presupuesto profesional para el service de tu vehículo. Seleccioná aceite, filtros y calculá el costo total al instante."
        canonical="/presupuesto"
      />
      <div className="container" style={{ maxWidth: '800px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 className="section-title">Generador de Presupuestos</h1>
          <p style={{ color: 'var(--color-text-3)' }}>Armá un presupuesto profesional para tu cliente paso a paso</p>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '16px', left: '10%', right: '10%', height: '2px', background: 'var(--color-bg-2)', zIndex: 0 }} />
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ zTargetContentIndex: 1, textAlign: 'center', flex: 1, position: 'relative', zIndex: 1 }}>
              <div 
                className="flex-center"
                style={{
                  width: '32px', height: '32px', borderRadius: '50%', margin: '0 auto 0.5rem',
                  background: currentStep === i ? 'var(--color-primary)' : selectedItems[i] ? '#22c55e' : 'var(--color-bg-3)',
                  color: '#fff', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.3s'
                }}
              >
                {selectedItems[i] ? <FiCheckCircle /> : i + 1}
              </div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: currentStep === i ? 'var(--color-primary)' : 'var(--color-text-3)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Seleccionar {step.label}</h2>
            <button className="btn btn-ghost btn-sm" onClick={handleSkip}>Omitir paso <FiArrowRight /></button>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <input 
              className="input" 
              placeholder={`Buscar ${step.label.toLowerCase()}...`} 
              value={search} onChange={e => setSearch(e.target.value)} 
            />
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
            {loading ? (
              <div className="flex-center" style={{ padding: '3rem' }}><div className="spinner" /></div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-bg-2)', borderRadius: '12px' }}>
                <p style={{ opacity: 0.5 }}>No se encontraron {step.label.toLowerCase()} disponibles.</p>
              </div>
            ) : filteredProducts.map(p => (
              <div 
                key={p._id} 
                className="card" 
                style={{ 
                  padding: '1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: selectedItems[currentStep]?._id === p._id ? 'var(--color-primary-glow)' : 'var(--color-bg-2)',
                  border: selectedItems[currentStep]?._id === p._id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  transition: 'all 0.2s'
                }}
                onClick={() => handleSelect(p)}
              >
                <div>
                  <p style={{ fontWeight: 700, fontSize: '1rem' }}>{p.name}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-3)', marginTop: '0.2rem' }}>{p.brand || 'Marca genérica'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.1rem' }}>{formatPrice(p.price)}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
            <button 
              className="btn btn-ghost" 
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              <FiArrowLeft /> Anterior
            </button>
            {currentStep === STEPS.length - 1 && (
              <button 
                className="btn btn-primary" 
                onClick={generatePDF}
                disabled={!selectedItems.some(i => i)}
              >
                Generar PDF <FiDownload style={{ marginLeft: '0.5rem' }} />
              </button>
            )}
          </div>
        </div>

        {/* Floating Summary */}
        {selectedItems.some(i => i) && (
          <div className="card" style={{ marginTop: '2rem', borderTop: '4px solid var(--color-primary)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem' }}>Resumen del Presupuesto</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedItems.map((item, i) => item && (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-2)' }}>
                    <strong style={{ color: 'var(--color-primary)' }}>{STEPS[i].label}:</strong> {item.name}
                  </span>
                  <span style={{ fontWeight: 700 }}>{formatPrice(item.price)}</span>
                </div>
              ))}
              <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.5rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.25rem' }}>
                <span>Total Final</span>
                <span style={{ color: 'var(--color-primary)' }}>
                  {formatPrice(selectedItems.reduce((acc, curr) => acc + (curr?.price || 0), 0))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
