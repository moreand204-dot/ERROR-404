// صفحة العنصر مع وسوم Open Graph: واتساب/تلجرام/فيسبوك يعرضوا صورة العنصر واسمه ووصفه
const fs = require('fs');
const path = require('path');
const { esc, str, validId, getDocFields, originOf } = require('./_lib');

module.exports = async (req, res) => {
  const id = String(req.query.id || '');
  const origin = originOf(req);
  let html = fs.readFileSync(path.join(process.cwd(), 'tpl', 'app.html'), 'utf8');

  let f = null, store = null;
  if (validId(id)) {
    try { f = await getDocFields(`apps/${id}`); } catch (e) {}
    try { store = await getDocFields('settings/store'); } catch (e) {}
  }
  const siteName = (store && `${str(store.storeName)} ${str(store.storeSub)}`.trim()) || 'ERROR 404 NOT FOUND';

  let title = siteName, desc = 'متجر تطبيقات وألعاب وأدوات وملفات.', image = `${origin}/assets/icon-512.jpg`;
  if (f) {
    const name = str(f.name) || 'ERROR 404';
    const kind = str(f.kind) === 'file' ? 'ملف' : 'برنامج';
    const text = str(f.description).replace(/\s+/g, ' ').trim();
    const bits = [kind, str(f.category), str(f.version) && `الإصدار ${str(f.version)}`, str(f.size)].filter(Boolean).join(' · ');
    title = `${name} — ${siteName}`;
    desc = (text ? text : bits).slice(0, 200);
    const icon = str(f.iconURL);
    if (icon) image = `${origin}/api/img?id=${encodeURIComponent(id)}&v=${icon.length}`;
  }
  const url = `${origin}/app.html?id=${encodeURIComponent(id)}`;
  const meta = [
    `<meta name="description" content="${esc(desc)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(siteName)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(image)}">`,
    `<meta property="og:image:width" content="512"><meta property="og:image:height" content="512">`,
    `<meta property="og:locale" content="ar_AR">`,
    `<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(image)}">`
  ].join('');
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`).replace('</head>', `${meta}</head>`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
  res.status(200).send(html);
};
