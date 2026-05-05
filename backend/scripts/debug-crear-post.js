const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

async function run() {
  const login = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@nazabarber.com', password: 'admin123' })
  });
  const loginData = await login.json();
  console.log('login status', login.status, loginData?.message || 'ok');
  if (!login.ok) return;

  const token = loginData.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const fd = new FormData();
  fd.append('file', new Blob([Buffer.from(b64, 'base64')], { type: 'image/png' }), 'tiny.png');

  const up = await fetch('http://localhost:3000/api/redsocial/upload-image', {
    method: 'POST',
    headers: authHeaders,
    body: fd
  });
  const upData = await up.json();
  console.log('upload status', up.status, upData);
  if (!up.ok) return;

  const createHeaders = { 'Content-Type': 'application/json', ...authHeaders };

  const c1 = await fetch('http://localhost:3000/api/redsocial/crear-post', {
    method: 'POST',
    headers: createHeaders,
    body: JSON.stringify({
      imagen: upData.imageUrl,
      imagePublicId: upData.imagePublicId,
      descripcion: ''
    })
  });
  const d1 = await c1.json();
  console.log('crear image only status', c1.status, d1);

  const c2 = await fetch('http://localhost:3000/api/redsocial/crear-post', {
    method: 'POST',
    headers: createHeaders,
    body: JSON.stringify({
      imagen: upData.imageUrl,
      imagePublicId: upData.imagePublicId,
      descripcion: 'post con descripcion'
    })
  });
  const d2 = await c2.json();
  console.log('crear image+desc status', c2.status, d2);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
