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

export async function fbTransaction(path, updateFn) {
  let attempts = 0;
  const maxAttempts = 15;
  while (attempts < maxAttempts) {
    try {
      const url = dbUrl(path);
      const getRes = await fetch(url, {
        headers: { 'X-Firebase-ETag': 'true' }
      });
      if (!getRes.ok) throw new Error('GET ' + getRes.status);
      const etag = getRes.headers.get('ETag');
      const currentData = await getRes.json();
      
      const newData = updateFn(currentData);
      if (newData === undefined) {
        // Abort transaction
        return currentData;
      }
      
      let body;
      if (newData === null) {
        body = 'null';
      } else {
        newData.ts = Date.now();
        body = JSON.stringify(newData);
      }
      
      const putRes = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'if-match': etag
        },
        body
      });
      
      if (putRes.status === 412) {
        attempts++;
        continue;
      }
      
      if (!putRes.ok) throw new Error('PUT ' + putRes.status);
      return await putRes.json();
    } catch (e) {
      console.error('Transaction attempt failed:', e);
      attempts++;
    }
  }
  throw new Error('Transaction failed after max attempts');
}
