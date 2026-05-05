/**
 * Setup: Crear usuarios de prueba para PASO 5
 */
const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function request(method, path, body = null) {
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

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        body: data ? JSON.parse(data) : null,
                    });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
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

async function setup() {
    console.log('🔧 Setup: Creando usuarios de prueba...\n');

    // Intentar registrar cliente
    console.log('📝 Registrando cliente...');
    const clientRes = await request('POST', '/api/auth/registrar', {
        nombre: 'Cliente Test',
        email: 'cliente@test.com',
        password: 'Test123456',
        telefono: '1234567890'
    });

    if (clientRes.status === 201 || clientRes.status === 400) {
        console.log(`   Status: ${clientRes.status} (${clientRes.status === 400 ? 'ya existe' : 'creado'})`);
    } else {
        console.log(`   ❌ Error: ${clientRes.status}`);
    }

    // Intentar registrar admin (si el endpoint lo permite con rol)
    console.log('📝 Registrando admin...');
    const adminRes = await request('POST', '/api/auth/registrar', {
        nombre: 'Admin Test',
        email: 'admin@test.com',
        password: 'Admin123456',
        telefono: '0987654321'
    });

    if (adminRes.status === 201 || adminRes.status === 400) {
        console.log(`   Status: ${adminRes.status} (${adminRes.status === 400 ? 'ya existe' : 'creado'})`);
    } else {
        console.log(`   ❌ Error: ${adminRes.status}`);
    }

    console.log('\n✅ Setup completado. Usuarios de prueba listos.\n');
}

setup().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
