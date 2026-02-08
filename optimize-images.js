import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, 'public');

async function optimizeImage(inputPath, outputPath, width, options = {}) {
  try {
    const pipeline = sharp(inputPath).resize(width, width, { 
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    });
    
    const info = await pipeline
      .webp({ quality: 80, effort: 6, ...options })
      .toFile(outputPath);
    
    console.log(`✓ Optimized: ${outputPath}`);
    console.log(`  Size: ${(info.size / 1024).toFixed(2)} KB`);
    return info;
  } catch (error) {
    console.error(`✗ Failed: ${inputPath}`, error.message);
  }
}

async function main() {
  console.log('Optimizing images...\n');

  // Optimize logo variants for UI and icons
  await optimizeImage(
    join(publicDir, 'zeus-logo-main.webp'),
    join(publicDir, 'zeus-logo-main-16.webp'),
    16,
    { quality: 80, effort: 6 }
  );

  await optimizeImage(
    join(publicDir, 'zeus-logo-main.webp'),
    join(publicDir, 'zeus-logo-main-32.webp'),
    32,
    { quality: 80, effort: 6 }
  );

  await optimizeImage(
    join(publicDir, 'zeus-logo-main.webp'),
    join(publicDir, 'zeus-logo-main-64.webp'),
    64,
    { quality: 80, effort: 6 }
  );

  await optimizeImage(
    join(publicDir, 'zeus-logo-main.webp'),
    join(publicDir, 'zeus-logo-main-96.webp'),
    96,
    { quality: 80, effort: 6 }
  );

  await optimizeImage(
    join(publicDir, 'zeus-logo-main.webp'),
    join(publicDir, 'zeus-logo-main-128.webp'),
    128,
    { quality: 80, effort: 6 }
  );

  await optimizeImage(
    join(publicDir, 'zeus-logo-main.webp'),
    join(publicDir, 'zeus-logo-main-192.webp'),
    192,
    { quality: 80, effort: 6 }
  );

  await optimizeImage(
    join(publicDir, 'zeus-logo-main.webp'),
    join(publicDir, 'zeus-logo-main-180.webp'),
    180,
    { quality: 80, effort: 6 }
  );

  // Optimize package image
  await optimizeImage(
    join(publicDir, 'zeusservicesPackage.png'),
    join(publicDir, 'zeusservicesPackage.webp'),
    600,
    { quality: 75, effort: 6 }
  );
  
  console.log('\n✓ All images optimized!');
}

main().catch(console.error);
