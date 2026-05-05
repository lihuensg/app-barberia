const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { loginLimiter, registerLimiter, forgotPasswordLimiter } = require('../middlewares/rateLimiter.middleware');
const { validateBody, validateParams } = require('../middlewares/validate.middleware');
const {
	registerBodySchema,
	loginBodySchema,
	forgotPasswordBodySchema,
	resetPasswordParamsSchema,
	resetPasswordBodySchema,
} = require('../validations/auth.validation');

// Con rate limiting
router.post('/registrar', registerLimiter, validateBody(registerBodySchema), authController.registrar);
router.post('/login', loginLimiter, validateBody(loginBodySchema), authController.login);
router.post('/forgot-password', forgotPasswordLimiter, validateBody(forgotPasswordBodySchema), authController.forgotPassword);
router.post('/reset-password/:token', validateParams(resetPasswordParamsSchema), validateBody(resetPasswordBodySchema), authController.resetPassword);

module.exports = router;