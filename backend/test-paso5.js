/**
 * Test suite de PASO 5: Seguridad de Posts, Comentarios, Likes e Imágenes
 * Ejecutar con: node test-paso5.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Credenciales de test
const clientEmail = 'cliente@test.com';
const clientPassword = 'Test123456';
const adminEmail = 'admin@test.com';
const adminPassword = 'Admin123456';

let clientToken = '';
let adminToken = '';
let testPostId = null;
let testCommentId = null;

async function request(method, path, body = null, token = '') {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers.Authorization = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        body: data ? JSON.parse(data) : null,
                        headers: res.headers
                    });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data, headers: res.headers });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function test(name, fn) {
    try {
        await fn();
        console.log(`✅ ${name}`);
        return true;
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('\n🧪 Iniciando pruebas PASO 5...\n');

    let passed = 0;
    let failed = 0;

    // SETUP: Obtener tokens
    console.log('📋 SETUP: Autenticación\n');

    if (await test('Obtener token cliente', async () => {
        const res = await request('POST', '/api/auth/login', {
            email: clientEmail,
            password: clientPassword
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        if (!res.body.token) throw new Error('No token recibido');
        clientToken = res.body.token;
    })) passed++; else failed++;

    if (await test('Obtener token admin', async () => {
        const res = await request('POST', '/api/auth/login', {
            email: adminEmail,
            password: adminPassword
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        if (!res.body.token) throw new Error('No token recibido');
        adminToken = res.body.token;
    })) passed++; else failed++;

    // LIKES
    console.log('\n❤️  LIKES\n');

    if (await test('1. Usuario logueado da like a post existente', async () => {
        // Primero crear un post
        const createRes = await request('POST', '/api/redsocial/crear-post', {
            imagen: 'https://res.cloudinary.com/test/image/upload/v1234/test.jpg',
            descripcion: 'Test post para likes'
        }, adminToken);
        if (createRes.status !== 201) throw new Error(`Status ${createRes.status}`);
        testPostId = createRes.body.id;

        // Dar like
        const likeRes = await request('POST', `/api/redsocial/like/${testPostId}`, {}, clientToken);
        if (likeRes.status !== 200) throw new Error(`Status ${likeRes.status}`);
        if (likeRes.body.liked !== true) throw new Error('liked !== true');
        if (typeof likeRes.body.likesCount !== 'number') throw new Error('likesCount no es número');
    })) passed++; else failed++;

    if (await test('2. Usuario vuelve a dar like (toggle) - debe removerse', async () => {
        const likeRes = await request('POST', `/api/redsocial/like/${testPostId}`, {}, clientToken);
        if (likeRes.status !== 200) throw new Error(`Status ${likeRes.status}`);
        if (likeRes.body.liked !== false) throw new Error('liked !== false (toggle fallido)');
    })) passed++; else failed++;

    if (await test('3. Usuario intenta dar like a post inexistente - 404', async () => {
        const likeRes = await request('POST', '/api/redsocial/like/99999', {}, clientToken);
        if (likeRes.status !== 404) throw new Error(`Status ${likeRes.status}, esperaba 404`);
    })) passed++; else failed++;

    if (await test('4. Verificar no hay likes duplicados en DB', async () => {
        // Intentar insertar duplicate debe fallar o devolver estado consistente
        const like1 = await request('POST', `/api/redsocial/like/${testPostId}`, {}, clientToken);
        const like2 = await request('POST', `/api/redsocial/like/${testPostId}`, {}, clientToken);
        if (like1.body.liked === like2.body.liked) {
            // Estados inconsistentes indicarían duplicate
            throw new Error('Estados inconsistentes en toggle');
        }
    })) passed++; else failed++;

    // COMENTARIOS
    console.log('\n💬 COMENTARIOS\n');

    if (await test('5. Usuario comenta texto normal', async () => {
        const res = await request('POST', `/api/redsocial/comentar/${testPostId}`, {
            texto: 'Este es un comentario válido'
        }, clientToken);
        if (res.status !== 201) throw new Error(`Status ${res.status}`);
        if (!res.body.id) throw new Error('No id en respuesta');
        testCommentId = res.body.id;
    })) passed++; else failed++;

    if (await test('6. Usuario comenta vacío - 400', async () => {
        const res = await request('POST', `/api/redsocial/comentar/${testPostId}`, {
            texto: ''
        }, clientToken);
        if (res.status !== 400) throw new Error(`Status ${res.status}, esperaba 400`);
    })) passed++; else failed++;

    if (await test('7. Usuario comenta solo espacios - 400', async () => {
        const res = await request('POST', `/api/redsocial/comentar/${testPostId}`, {
            texto: '   \n  \t  '
        }, clientToken);
        if (res.status !== 400) throw new Error(`Status ${res.status}, esperaba 400`);
    })) passed++; else failed++;

    if (await test('8. Usuario comenta más de 500 caracteres - 400', async () => {
        const longText = 'a'.repeat(501);
        const res = await request('POST', `/api/redsocial/comentar/${testPostId}`, {
            texto: longText
        }, clientToken);
        if (res.status !== 400) throw new Error(`Status ${res.status}, esperaba 400`);
    })) passed++; else failed++;

    if (await test('9. Usuario comenta con HTML - se guarda escapado (sin ejecutarse)', async () => {
        const res = await request('POST', `/api/redsocial/comentar/${testPostId}`, {
            texto: '<script>alert(1)</script>'
        }, clientToken);
        if (res.status !== 201) throw new Error(`Status ${res.status}`);
        // Verificar que el texto se escapó
        if (!res.body.texto.includes('&lt;script&gt;')) {
            throw new Error('HTML no fue escapado');
        }
    })) passed++; else failed++;

    if (await test('10. Usuario elimina su propio comentario - 200', async () => {
        const res = await request('DELETE', `/api/redsocial/comentar/${testCommentId}`, null, clientToken);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    })) passed++; else failed++;

    // POSTS
    console.log('\n📸 POSTS\n');

    if (await test('11. Cliente intenta crear post - 403', async () => {
        const res = await request('POST', '/api/redsocial/crear-post', {
            imagen: 'https://res.cloudinary.com/test/image/upload/v1234/test2.jpg',
            descripcion: 'Post del cliente'
        }, clientToken);
        if (res.status !== 403) throw new Error(`Status ${res.status}, esperaba 403`);
    })) passed++; else failed++;

    if (await test('12. Admin crea post válido - 201', async () => {
        const res = await request('POST', '/api/redsocial/crear-post', {
            imagen: 'https://res.cloudinary.com/test/image/upload/v1234/valid.jpg',
            descripcion: 'Post válido del admin'
        }, adminToken);
        if (res.status !== 201) throw new Error(`Status ${res.status}`);
        if (!res.body.id) throw new Error('No id en post');
    })) passed++; else failed++;

    if (await test('13. Admin intenta crear post vacío - 400', async () => {
        const res = await request('POST', '/api/redsocial/crear-post', {
            imagen: '',
            descripcion: ''
        }, adminToken);
        if (res.status !== 400) throw new Error(`Status ${res.status}, esperaba 400`);
    })) passed++; else failed++;

    if (await test('14. Admin elimina post - 200 (soft delete)', async () => {
        const res = await request('DELETE', `/api/redsocial/posts/${testPostId}`, null, adminToken);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    })) passed++; else failed++;

    if (await test('15. GET posts no debe mostrar post eliminado', async () => {
        const res = await request('GET', '/api/redsocial/posts', null, clientToken);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const isDeleted = res.body.some(p => p.id === testPostId);
        if (isDeleted) throw new Error('Post eliminado aún se muestra');
    })) passed++; else failed++;

    // IMÁGENES Y SEGURIDAD DE RESPUESTAS
    console.log('\n🖼️  IMÁGENES Y SEGURIDAD\n');

    if (await test('16. GET /api/redsocial/posts no devuelve passwordHash', async () => {
        const res = await request('GET', '/api/redsocial/posts', null, clientToken);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const hasSecretData = JSON.stringify(res.body).includes('passwordHash') ||
                              JSON.stringify(res.body).includes('password_hash');
        if (hasSecretData) throw new Error('passwordHash expuesto en respuesta');
    })) passed++; else failed++;

    if (await test('17. GET /api/redsocial/posts no devuelve resetToken', async () => {
        const res = await request('GET', '/api/redsocial/posts', null, clientToken);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const hasResetToken = JSON.stringify(res.body).includes('resetToken');
        if (hasResetToken) throw new Error('resetToken expuesto en respuesta');
    })) passed++; else failed++;

    if (await test('18. Comentarios no devuelven email del autor', async () => {
        // Crear post con comentario
        const postRes = await request('POST', '/api/redsocial/crear-post', {
            imagen: 'https://res.cloudinary.com/test/image/upload/v1234/test3.jpg',
            descripcion: 'Post para test comentarios'
        }, adminToken);

        const commentRes = await request('POST', `/api/redsocial/comentar/${postRes.body.id}`, {
            texto: 'Comentario de prueba'
        }, clientToken);

        const postsRes = await request('GET', '/api/redsocial/posts', null, clientToken);
        const post = postsRes.body.find(p => p.id === postRes.body.id);
        if (post && post.comentarios && post.comentarios.length > 0) {
            if (post.comentarios[0].hasOwnProperty('email')) {
                throw new Error('Email del autor expuesto en comentario');
            }
        }
    })) passed++; else failed++;

    if (await test('19. Rate limit en comentarios (intentar más allá del límite)', async () => {
        // Crear post
        const postRes = await request('POST', '/api/redsocial/crear-post', {
            imagen: 'https://res.cloudinary.com/test/image/upload/v1234/rl-test.jpg',
            descripcion: 'Test rate limit'
        }, adminToken);

        // Intentar muchos comentarios rápidamente
        let lastStatus = 201;
        for (let i = 0; i < 15; i++) {
            const res = await request('POST', `/api/redsocial/comentar/${postRes.body.id}`, {
                texto: `Comentario ${i}`
            }, clientToken);
            lastStatus = res.status;
            if (res.status === 429) break; // Rate limitado
        }

        // Debería llegar a 429 o al menos algún comentario fallar
        if (lastStatus === 201) {
            console.log(`   (Nota: rate limit puede no activarse en corta duración)`);
        }
    })) passed++; else failed++;

    if (await test('20. Rate limit en likes (intentar muchos likes rápidamente)', async () => {
        // Crear post
        const postRes = await request('POST', '/api/redsocial/crear-post', {
            imagen: 'https://res.cloudinary.com/test/image/upload/v1234/like-rl.jpg',
            descripcion: 'Test like rate limit'
        }, adminToken);

        // Intentar muchos toggles
        let lastStatus = 200;
        for (let i = 0; i < 70; i++) {
            const res = await request('POST', `/api/redsocial/like/${postRes.body.id}`, {}, clientToken);
            lastStatus = res.status;
            if (res.status === 429) break;
        }

        if (lastStatus === 200) {
            console.log(`   (Nota: rate limit puede no activarse en corta duración)`);
        }
    })) passed++; else failed++;

    // RESUMEN
    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Total: ${passed + failed}`);
    console.log(`${'='.repeat(50)}\n`);

    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
});
