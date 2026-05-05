const prisma = require('../config/prisma');

async function crearComentario({ postId, autorId, texto }) {
    const comentario = await prisma.comentario.create({
        data: {
            postId,
            autorId,
            texto
        }
    });

    return comentario;
}

async function eliminarComentario(comentarioId) {
    return prisma.comentario.update({
        where: { id: comentarioId },
        data: { deletedAt: new Date() }
    });
}

async function buscarPorId(comentarioId) {
    return prisma.comentario.findFirst({
        where: { id: comentarioId, deletedAt: null }
    });
}

module.exports = {
    crearComentario,
    eliminarComentario,
    buscarPorId
};