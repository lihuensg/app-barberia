/**
 * Funciones de sanitización para remover datos sensibles
 * de las respuestas JSON
 */

/**
 * Sanitizar usuario: remover passwordHash y otros datos sensibles
 */
function sanitizeUser(usuario) {
    if (!usuario) return null;

    const { passwordHash, ...safe } = usuario;

    return {
        id: safe.id,
        nombre: safe.nombre,
        email: safe.email,
        telefono: safe.telefono || null,
        instagram: safe.instagram || null,
        whatsapp: safe.whatsapp || null,
        bio: safe.bio || null,
        foto: safe.foto || null,
        rol: safe.rol,
        createdAt: safe.createdAt,
        updatedAt: safe.updatedAt,
    };
}

/**
 * Sanitizar array de usuarios
 */
function sanitizeUsers(usuarios) {
    if (!Array.isArray(usuarios)) return [];
    return usuarios.map(sanitizeUser);
}

/**
 * Sanitizar turno: remover datos sensibles si existen
 */
function sanitizeTurno(turno) {
    if (!turno) return null;

    const result = {
        id: turno.id,
        fecha: turno.fecha,
        hora: turno.hora,
        estado: turno.estado,
        createdAt: turno.createdAt,
        updatedAt: turno.updatedAt,
    };

    // Si tiene usuario asociado, sanitizar
    if (turno.usuario) {
        result.usuario = sanitizeUser(turno.usuario);
    }

    // Otros campos opcionales
    if (turno.clienteNombre) result.clienteNombre = turno.clienteNombre;
    if (turno.clienteEmail) result.clienteEmail = turno.clienteEmail;
    if (turno.clienteTelefono) result.clienteTelefono = turno.clienteTelefono;

    return result;
}

/**
 * Sanitizar array de turnos
 */
function sanitizeTurnos(turnos) {
    if (!Array.isArray(turnos)) return [];
    return turnos.map(sanitizeTurno);
}

/**
 * Sanitizar post: remover datos sensibles
 */
function sanitizePost(post) {
    if (!post) return null;

    const result = {
        id: post.id,
        titulo: post.titulo,
        descripcion: post.descripcion,
        imagen: post.imagen,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
    };

    // Si tiene usuario asociado (admin), sanitizar
    if (post.usuario) {
        result.usuario = sanitizeUser(post.usuario);
    }

    // Likes y comentarios
    if (post.likes !== undefined) {
        result.likes = post.likes;
    }

    if (post.likedByMe !== undefined) {
        result.likedByMe = post.likedByMe;
    }

    if (post.comentarios !== undefined) {
        result.comentarios = Array.isArray(post.comentarios)
            ? post.comentarios.map(c => ({
                id: c.id,
                texto: c.texto,
                autorNombre: c.autorNombre,
                createdAt: c.createdAt,
            }))
            : [];
    }

    return result;
}

/**
 * Sanitizar array de posts
 */
function sanitizePosts(posts) {
    if (!Array.isArray(posts)) return [];
    return posts.map(sanitizePost);
}

module.exports = {
    sanitizeUser,
    sanitizeUsers,
    sanitizeTurno,
    sanitizeTurnos,
    sanitizePost,
    sanitizePosts,
};
