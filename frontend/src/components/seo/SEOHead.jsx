import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://lubricentro-eden.com.ar';
const SITE_NAME = 'Lubricentro Eden';
const DEFAULT_IMAGE = `${SITE_URL}/aceite-premium.jpg`;

/**
 * Componente SEO reutilizable para todas las páginas.
 * Maneja title, description, canonical, Open Graph y Twitter Cards.
 */
export default function SEOHead({
  title,
  description,
  canonical,
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  jsonLd = null,
  children,
}) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Aceites, Filtros y Repuestos Automotor`;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;

  return (
    <Helmet>
      {/* Básicos */}
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={image} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="es_AR" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (Array.isArray(jsonLd)
        ? jsonLd.map((schema, i) => (
            <script key={i} type="application/ld+json">
              {JSON.stringify(schema)}
            </script>
          ))
        : (
            <script type="application/ld+json">
              {JSON.stringify(jsonLd)}
            </script>
          )
      )}

      {children}
    </Helmet>
  );
}
