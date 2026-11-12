import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const publicDir = new URL('public/', root);
const mascot = await readFile(new URL('mascot.svg', publicDir), 'utf8');
const head = await readFile(new URL('mascot-head.svg', publicDir), 'utf8');
const inner = (svg) => svg.replace(/<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const escape = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const text = (x, y, value, size = 28, color = '#6c5ce7', weight = 700) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}">${escape(value)}</text>`;
const robot = (x, y, width) => `<svg x="${x}" y="${y}" width="${width}" height="${width * 1.05}" viewBox="0 0 400 420">${inner(mascot)}</svg>`;
const pill = (x, y, width, label, fill) => `<rect x="${x}" y="${y}" width="${width}" height="54" rx="27" fill="${fill}"/>${text(x + 22, y + 36, label, 25, '#fff')}`;
const shell = (w, h, content) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#f3efff"/><stop offset="1" stop-color="#e8faf6"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <circle cx="${w - 30}" cy="30" r="180" fill="#ffeaa7" opacity=".55"/>
  <circle cx="25" cy="${h - 20}" r="160" fill="#d5ccff" opacity=".55"/>
  <rect x="18" y="18" width="${w - 36}" height="${h - 36}" rx="38" fill="none" stroke="#00cec9" stroke-width="6"/>
  <g font-family="Nunito, Segoe UI, sans-serif">${content}</g></svg>`;

await mkdir(new URL('pr/', publicDir), { recursive: true });
const assets = [
  ['og-image-v2.jpg', 1200, 630,
    text(64, 106, 'MateVentura', 68) + text(68, 153, 'cu Cifrel', 32, '#007f76') +
    text(64, 231, 'Numere mici.', 48) + text(64, 290, 'Aventuri mari.', 48) +
    pill(64, 335, 280, 'Învățare pas cu pas', '#009c81') + pill(360, 335, 245, 'Jocuri pe niveluri', '#087fce') +
    text(64, 443, 'Adunări și scăderi · 5–8 ani', 31, '#2d3436') +
    text(64, 493, 'Gratuit · Fără cont · Fără reclame', 26, '#2d3436') +
    text(64, 567, 'gabibarzu.github.io/MateVentura', 25) + robot(725, 105, 420)],
  ['pr/post-1080x1080.png', 1080, 1080,
    text(70, 120, 'MateVentura', 74) + text(74, 174, 'cu Cifrel', 36, '#007f76') +
    text(70, 267, 'Numere mici.', 60) + text(70, 337, 'Aventuri mari.', 60) + robot(570, 160, 440) +
    pill(70, 439, 400, 'Învățare în ritmul tău', '#009c81') +
    text(74, 539, 'Ajutor pas cu pas, fără timp sau scor.', 29, '#2d3436') +
    pill(70, 610, 340, 'Jocuri pe niveluri', '#087fce') +
    text(74, 710, 'Adunări și scăderi · Copii de 5–8 ani', 34, '#2d3436') +
    text(74, 790, 'Gratuit · Fără cont · Fără reclame', 32, '#2d3436') +
    text(74, 905, 'Facem echipă?', 48) + text(74, 985, 'gabibarzu.github.io/MateVentura', 30)],
  ['pr/story-1080x1920.png', 1080, 1920,
    text(90, 260, 'MateVentura', 82) + text(94, 325, 'cu Cifrel', 42, '#007f76') +
    text(90, 435, 'Numere mici.', 66) + text(90, 515, 'Aventuri mari.', 66) + robot(230, 565, 620) +
    pill(90, 1255, 550, 'Învățare în ritmul tău', '#009c81') +
    text(94, 1360, 'Ajutor pas cu pas · Jocuri pe niveluri', 36, '#2d3436') +
    text(94, 1440, 'Adunări și scăderi · 5–8 ani', 40, '#2d3436') +
    text(94, 1520, 'Gratuit · Fără cont · Fără reclame', 36, '#2d3436') +
    text(94, 1650, 'Facem echipă?', 56) + text(94, 1730, 'gabibarzu.github.io/MateVentura', 36)],
  ['pr/cover-facebook-1640x624.png', 1640, 624,
    text(350, 155, 'MateVentura cu Cifrel', 66) +
    text(350, 245, 'Numere mici. Aventuri mari.', 48) +
    text(350, 330, 'Învățare pas cu pas · Jocuri pe niveluri', 34, '#007f76') +
    text(350, 405, 'Adunări și scăderi · 5–8 ani · Gratuit', 30, '#2d3436') +
    text(350, 475, 'gabibarzu.github.io/MateVentura', 28) + robot(1190, 105, 360)],
  ['pr/profil-1080x1080.png', 1080, 1080,
    `<svg x="200" y="200" width="680" height="680" viewBox="${head.match(/viewBox="([^"]+)"/)[1]}">${inner(head)}</svg>`],
];

for (const [name, width, height, content] of assets) {
  const image = sharp(Buffer.from(shell(width, height, content)));
  const output = fileURLToPath(new URL(name, publicDir));
  if (name.endsWith('.jpg')) await image.jpeg({ quality: 93 }).toFile(output);
  else await image.png().toFile(output);
  console.log(`${name}: ${width}×${height}`);
}
// Keep the previous direct URL working; metadata uses the versioned URL to avoid stale image caches.
await sharp(fileURLToPath(new URL('og-image-v2.jpg', publicDir)))
  .toFile(fileURLToPath(new URL('og-image.jpg', publicDir)));