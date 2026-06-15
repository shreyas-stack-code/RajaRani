const FIREBASE_URL = import.meta.env.VITE_FIREBASE_URL;

function dbUrl(path) {
  if (!FIREBASE_URL) return '';
  return FIREBASE_URL.replace(/\/$/, '') + '/' + path + '.json';
}

export async function fbGet(path) {
  const r = await fetch(dbUrl(path));
  if (!r.ok) throw new Error('GET ' + r.status);
  return r.json();
}

export async function fbSet(path, data) {
  data.ts = Date.now();
  const r = await fetch(dbUrl(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error('SET ' + r.status);
  return r.json();
}

export async function fbPatch(path, data) {
  data.ts = Date.now();
  const r = await fetch(dbUrl(path), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error('PATCH ' + r.status);
  return r.json();
}

export async function fbDelete(path) {
  await fetch(dbUrl(path), { method: 'DELETE' });
}
