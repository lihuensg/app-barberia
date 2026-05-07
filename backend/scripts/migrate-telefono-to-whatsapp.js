const prisma = require('../src/config/prisma');
const { normalizeTelefono } = require('../src/utils/turnosBusiness');

async function migrateUsuarios() {
  console.log('Migrando usuarios: copiando telefono -> whatsapp cuando whatsapp IS NULL');
  const usuarios = await prisma.usuario.findMany({
    where: { whatsapp: null, telefono: { not: null } },
    select: { id: true, telefono: true },
  });

  console.log(`Encontrados ${usuarios.length} usuarios a migrar`);

  for (const u of usuarios) {
    await prisma.usuario.update({
      where: { id: u.id },
      data: { whatsapp: u.telefono },
    });
    console.log(`Usuario ${u.id} actualizado: whatsapp=${u.telefono}`);
  }
}

async function migrateTurnosAnonimos() {
  console.log('Normalizando anonimo_telefono_normalizado en turnos');
  const turnos = await prisma.turno.findMany({
    where: { anonimoTelefono: { not: null }, anonimoTelefonoNormalizado: null },
    select: { id: true, anonimoTelefono: true },
  });

  console.log(`Encontrados ${turnos.length} turnos anónimos a normalizar`);

  for (const t of turnos) {
    const normalized = normalizeTelefono(t.anonimoTelefono);
    await prisma.turno.update({
      where: { id: t.id },
      data: { anonimoTelefonoNormalizado: normalized },
    });
    console.log(`Turno ${t.id} normalizado: ${normalized}`);
  }
}

async function run() {
  try {
    await migrateUsuarios();
    await migrateTurnosAnonimos();
    console.log('Migración finalizada');
    process.exit(0);
  } catch (err) {
    console.error('Error en migración:', err);
    process.exit(1);
  }
}

run();
