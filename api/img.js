// يحوّل أيقونة العنصر (المخزنة داخل Firestore) إلى صورة JPEG حقيقية قابلة للمعاينة في واتساب/تلجرام
const { str, validId, getDocFields } = require('./_lib');

module.exports = async (req, res) => {
  const id = String(req.query.id || '');
  const fallback = () => { res.statusCode = 302; res.setHeader('Location', '/assets/icon-512.jpg'); res.end(); };
  if (!validId(id)) return fallback();
  let icon = '';
  try { const f = await getDocFields(`apps/${id}`); icon = f ? str(f.iconURL) : ''; } catch (e) {}
  if (/^https?:\/\//.test(icon)) { res.statusCode = 302; res.setHeader('Location', icon); return res.end(); }
  const m = /^data:(image\/[\w.+-]+);base64,(.+)$/.exec(icon);
  if (!m) return fallback();

  let out = Buffer.from(m[2], 'base64'), type = m[1];
  try {
    const sharp = require('sharp');
    out = await sharp(out).resize(512, 512, { fit: 'cover' }).flatten({ background: '#0b1420' }).jpeg({ quality: 88 }).toBuffer();
    type = 'image/jpeg';
  } catch (e) { /* لو sharp مش متاح نرجّع الصورة الأصلية */ }

  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
  res.status(200).send(out);
};
