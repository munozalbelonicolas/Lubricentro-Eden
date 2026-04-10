/**
 * Genera favicons optimizados para Google y navegadores.
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE = path.join(__dirname, '../public/favicon.png');
const OUT = path.join(__dirname, '../public');

const sizes = [16, 32, 48, 192, 512];

(async () => {
  for (const size of sizes) {
    const outFile = path.join(OUT, `favicon-${size}.png`);
    await sharp(SOURCE)
      .resize(size, size, { fit: 'contain', background: { r: 13, g: 13, b: 13, alpha: 1 } })
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(outFile);
    const stats = fs.statSync(outFile);
    console.log(`✅ favicon-${size}.png (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  // favicon.ico como PNG de 48x48 (navegadores modernos lo aceptan)
  await sharp(SOURCE)
    .resize(48, 48, { fit: 'contain', background: { r: 13, g: 13, b: 13, alpha: 1 } })
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(path.join(OUT, 'favicon.ico'));
  console.log('✅ favicon.ico generado');

  console.log('\n🎉 Todos los favicons generados correctamente.');
})();
