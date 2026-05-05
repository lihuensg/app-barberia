const prisma = require('../config/prisma');

async function existeLike(postId, usuarioId) {
    const like = await prisma.like.findUnique({
        where: {
            postId_usuarioId: {
                postId,
                usuarioId
            }
        }
    });

    return !!like;
}

async function crearLike(postId, usuarioId) {
    await prisma.like.create({
        data: {
            postId,
            usuarioId
        }
    });
}

async function eliminarLike(postId, usuarioId) {
    await prisma.like.delete({
        where: {
            postId_usuarioId: {
                postId,
                usuarioId
            }
        }
    });
}

module.exports = {
    existeLike,
    crearLike,
    eliminarLike
};