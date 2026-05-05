const prisma = require('../config/prisma');

async function listarPosts(usuarioId, { page = 1, limit = 20, search } = {}) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const posts = await prisma.post.findMany({
        where: {
            deletedAt: null,
            ...(search
                ? {
                    descripcion: {
                        contains: search,
                        mode: 'insensitive',
                    },
                }
                : {}),
        },
        orderBy: {
            createdAt: 'desc'
        },
        skip,
        take: limitNumber,
        include: {
            autor: {
                select: {
                    id: true,
                    nombre: true,
                    foto: true,
                    instagram: true
                }
            },
            _count: {
                select: { likes: true }
            },
            comentarios: {
                orderBy: {
                    createdAt: 'asc'
                },
                where: {
                    deletedAt: null
                },
                select: {
                    id: true,
                    texto: true,
                    createdAt: true,
                    autor: {
                        select: {
                            id: true,
                            nombre: true,
                            foto: true
                        }
                    }
                }
            },
            likes: usuarioId ? {
                where: {
                    usuarioId: usuarioId
                },
                select: {
                    usuarioId: true
                }
            } : false
        }
    });

    return posts.map(post => {
        const { _count, likes, ...rest } = post;
        return {
            ...rest,
            likes: _count.likes,
            likedByMe: likes ? likes.length > 0 : false,
            created_at: post.createdAt,
            autorNombre: post.autor.nombre,
            autorFoto: post.autor.foto
        };
    });
}

async function buscarPorId(postId) {
    return prisma.post.findFirst({
        where: { id: parseInt(postId), deletedAt: null }
    });
}

async function crearPost({ imagen, descripcion, autorId, imagePublicId }) {
    return prisma.post.create({
        data: {
            imagen,
            descripcion,
            autorId: parseInt(autorId),
            imagePublicId: imagePublicId || undefined
        }
    });
}

async function eliminarPost(postId) {
    return prisma.post.update({
        where: { id: parseInt(postId) },
        data: { deletedAt: new Date() }
    });
}

module.exports = {
    listarPosts,
    buscarPorId,
    crearPost,
    eliminarPost
};