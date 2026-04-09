import fs from 'fs';
import path from 'path';
import axios from 'axios';

// URL de Producción y API
const SITE_URL = 'https://lubricentro-eden.com.ar';
const API_URL = 'https://lubricentro-eden.onrender.com/api';

const generateSitemap = async () => {
  try {
    console.log('Generando sitemap dinámico para SEO...');
    
    // Obtener productos desde el servidor remoto
    const { data } = await axios.get(`${API_URL}/products?limit=1000`);
    const products = data.data.products || [];

    const currentDate = new Date().toISOString().split('T')[0];

    // URLs Base requeridas por el usuario
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>${SITE_URL}/store</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;

    // Entradas para cada producto (Slugs)
    products.forEach((product) => {
      if (product.slug && product.isActive) {
        const lastMod = product.updatedAt ? product.updatedAt.split('T')[0] : currentDate;
        xml += `
  <url>
    <loc>${SITE_URL}/store/${product.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
    });

    xml += `\n</urlset>`;

    // Guardar en la carpeta public
    const publicPath = path.resolve(process.cwd(), 'public');
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath);
    }
    
    fs.writeFileSync(path.resolve(publicPath, 'sitemap.xml'), xml);
    
    console.log(`✅ Sitemap.xml generado exitosamente con ${products.length} productos incluidos.`);

  } catch (error) {
    console.error('❌ Error fatal generando sitemap:', error.message);
    process.exit(1);
  }
};

generateSitemap();
