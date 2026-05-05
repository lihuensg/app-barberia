const postsRepository = require('../repositories/posts.repository');
const comentariosRepository = require('../repositories/comentarios.repository');
const likesRepository = require('../repositories/likes.repository');
const prisma = require('../config/prisma');

function serializePost(post) {
    return {
        id: post.id,
        imagen: post.imagen,
        imagePublicId: post.imagePublicId || null,
        descripcion: post.descripcion,
        likes: post.likes,
        likedByMe: post.likedByMe ?? false,
        createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt,
        autorNombre: post.autor?.nombre ?? post.autorNombre ?? '',
        autorFoto: post.autor?.foto ?? post.autorFoto ?? null,
        comentarios: (post.comentarios ?? []).map(c => ({
            id: c.id,
            texto: c.texto,
            createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
            autorNombre: c.autor?.nombre ?? '',
            autorFoto: c.autor?.foto ?? null,
        })),
    };
}

async function getPosts(usuarioId, query) {
    const posts = await postsRepository.listarPosts(usuarioId, query);
    return posts.map(serializePost);
}

async function crearPost(autorId, data) {
    const { imagen, descripcion, imagePublicId } = data;

    if (!imagen) {
        const error = new Error('imagen es obligatoria');
        error.status = 400;
        throw error;
    }

    const descripcionFinal = typeof descripcion === 'string' ? descripcion.trim() : '';

    const post = await postsRepository.crearPost({ imagen, descripcion: descripcionFinal, autorId, imagePublicId });
    // Reload with all relations so we return a complete post
    const full = await prisma.post.findUnique({
        where: { id: post.id },
        include: {
            autor: { select: { id: true, nombre: true, foto: true, instagram: true } },
            _count: { select: { likes: true } },
            comentarios: {
                select: {
                    id: true, texto: true, createdAt: true,
                    autor: { select: { id: true, nombre: true, foto: true } }
                }
            },
            likes: false
        }
    });

    return serializePost({ ...full, likes: full._count.likes, likedByMe: false });
}

async function toggleLike(usuarioId, postId) {
    // Validar que el post existe
    const post = await postsRepository.buscarPorId(postId);

    if (!post) {
        const error = new Error('Post no encontrado');
        error.status = 404;
        throw error;
    }

    const existe = await likesRepository.existeLike(postId, usuarioId);

    try {
        if (existe) {
            // Eliminar like
            await likesRepository.eliminarLike(postId, usuarioId);
            
            // Contar likes actuales
            const likesCount = await prisma.like.count({
                where: { postId }
            });
            
            return { liked: false, likesCount };
        } else {
            // Crear like
            await likesRepository.crearLike(postId, usuarioId);
            
            // Contar likes actuales
            const likesCount = await prisma.like.count({
                where: { postId }
            });
            
            return { liked: true, likesCount };
        }
    } catch (error) {
        // Si falla por duplicado u otro error, determinar estado actual
        const existe2 = await likesRepository.existeLike(postId, usuarioId);
        const likesCount = await prisma.like.count({
            where: { postId }
        });
        
        return { 
            liked: existe2, 
            likesCount,
            message: 'Like procesado'
        };
    }
}

async function comentarPost(usuarioId, postId, data) {
    const { texto } = data;

    // Validar que el texto no esté vacío
    if (!texto || texto.trim() === '') {
        const error = new Error('El comentario no puede estar vacío');
        error.status = 400;
        throw error;
    }


    const textoTrimmed = texto.trim();

    // Validar longitud máxima (500 caracteres)
    if (textoTrimmed.length > 500) {
        const error = new Error('El comentario no puede superar los 500 caracteres');
        error.status = 400;
        throw error;
    }

    // Validar que el post existe
    const post = await postsRepository.buscarPorId(postId);

    if (!post) {
        const error = new Error('Post no encontrado');
        error.status = 404;
        throw error;
    }

    // Escapar HTML para evitar ejecución en frontend
    const { escapeHtml } = require('../utils/escapeHtml');

    const safeTexto = escapeHtml(textoTrimmed);

    // Crear el comentario
    const comentario = await comentariosRepository.crearComentario({
        postId,
        autorId: usuarioId,
        texto: safeTexto
    });

    // Reload con autor info
    const full = await prisma.comentario.findUnique({
        where: { id: comentario.id },
        include: { autor: { select: { nombre: true, foto: true } } }
    });

    return {
        id: full.id,
        texto: full.texto,
        createdAt: full.createdAt.toISOString(),
        autorNombre: full.autor.nombre,
        autorFoto: full.autor.foto,
    };
}

async function eliminarPost(postId) {
    const existente = await postsRepository.buscarPorId(postId);

    if (!existente) {
        const error = new Error('Post no encontrado');
        error.status = 404;
        throw error;
    }

    // Si existe imagePublicId, eliminar imagen de Cloudinary
    if (existente.imagePublicId) {
        const { deleteImage, CLOUDINARY_ENABLED } = require('../config/cloudinary');
        if (CLOUDINARY_ENABLED) {
            try {
                await deleteImage(existente.imagePublicId);
            } catch (err) {
                console.warn(`⚠️  No se pudo eliminar imagen de post (${existente.imagePublicId}):`, err.message);
            }
        }
    }

    return postsRepository.eliminarPost(postId);
}

async function eliminarComentario(usuarioId, comentarioId, isAdmin) {
    const comentario = await comentariosRepository.buscarPorId(comentarioId);

    if (!comentario) {
        const error = new Error('Comentario no encontrado');
        error.status = 404;
        throw error;
    }

    // Solo el autor o un admin pueden eliminar
    if (comentario.autorId !== usuarioId && !isAdmin) {
        const error = new Error('No tienes permiso para eliminar este comentario');
        error.status = 403;
        throw error;
    }

    await comentariosRepository.eliminarComentario(comentarioId);

    return { message: 'Comentario eliminado correctamente' };
}

module.exports = {
    getPosts,
    crearPost,
    toggleLike,
    comentarPost,
    eliminarPost,
    eliminarComentario
};