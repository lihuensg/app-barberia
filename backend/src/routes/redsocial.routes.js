const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const { adminCrearPostLimiter, adminEliminarLimiter, commentsLimiter, likesLimiter } = require('../middlewares/rateLimiter.middleware');
const { uploadPost } = require('../middlewares/upload.middleware');
const redsocialController = require('../controllers/redsocial.controller');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validate.middleware');
const {
	postsQuerySchema,
	crearPostBodySchema,
	likeParamsSchema,
	likeBodySchema,
	comentarParamsSchema,
	comentarBodySchema,
	eliminarPostParamsSchema,
} = require('../validations/redsocial.validation');

router.get('/posts', optionalAuthMiddleware, validateQuery(postsQuerySchema), redsocialController.getPosts);
router.post('/crear-post', authMiddleware, adminCrearPostLimiter, adminMiddleware, validateBody(crearPostBodySchema), redsocialController.crearPost);
router.post('/upload-image', authMiddleware, adminCrearPostLimiter, adminMiddleware, uploadPost.single('file'), redsocialController.uploadPostImage);
router.post('/like/:postId', authMiddleware, likesLimiter, validateParams(likeParamsSchema), validateBody(likeBodySchema), redsocialController.toggleLike);
router.post('/comentar/:postId', authMiddleware, commentsLimiter, validateParams(comentarParamsSchema), validateBody(comentarBodySchema), redsocialController.comentarPost);
router.delete('/comentar/:comentarioId', authMiddleware, redsocialController.eliminarComentario);
router.delete('/posts/:postId', authMiddleware, adminEliminarLimiter, adminMiddleware, validateParams(eliminarPostParamsSchema), redsocialController.eliminarPost);

module.exports = router;