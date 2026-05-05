const express = require('express');

const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const usuarioController = require('../controllers/usuario.controller');
const { validateBody, validateQuery } = require('../middlewares/validate.middleware');
const {
	updateMeBodySchema,
	subirFotoBodySchema,
	clientesQuerySchema,
} = require('../validations/usuario.validation');
const { uploadProfile } = require('../middlewares/upload.middleware');

router.get('/me', authMiddleware, usuarioController.getMe);
router.put('/me', authMiddleware, validateBody(updateMeBodySchema), usuarioController.updateMe);
// Frontend sends JSON body { foto: "url" } — no multipart needed
// Accept JSON { foto: url } or multipart form-data file field 'file'
router.put('/subir-foto', authMiddleware, uploadProfile.single('file'), usuarioController.subirFoto);

router.get('/admin-publicos', usuarioController.getAdminPublico);
router.get('/clientes', authMiddleware, adminMiddleware, validateQuery(clientesQuerySchema), usuarioController.getClientes);

module.exports = router;