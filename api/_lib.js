// أدوات مشتركة لدوال المعاينة (Open Graph) — قراءة مستند عام من Firestore بدون مكتبات
const PROJECT = 'ourstory-f33db';
const KEY = 'AIzaSyCypIGW0i3ugYgPLBoQrBm-WolT2Cvkyuo';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
const str = f => (f && (f.stringValue ?? (f.integerValue != null ? String(f.integerValue) : ''))) || '';
const validId = id => /^[A-Za-z0-9_-]{5,40}$/.test(id || '');

async function getDocFields(path) {
  const r = await fetch(`${BASE}/${path}?key=${KEY}`);
  if (!r.ok) return null;
  const j = await r.json();
  return j.fields || null;
}
const originOf = req => `https://${req.headers['x-forwarded-host'] || req.headers.host}`;

module.exports = { esc, str, validId, getDocFields, originOf };
