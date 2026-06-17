const express = require('express');
const router = express.Router();
const { registro, login, perfil } = require('../controllers/authController');
const { autenticar } = require('../middlewares/autenticacion');
const { validarRegistro, validarLogin } = require('../middlewares/validaciones');

// POST /api/auth/registro — público
router.post('/registro', validarRegistro, registro);

// POST /api/auth/login — público
router.post('/login', validarLogin, login);

// GET /api/auth/perfil — protegido
router.get('/perfil', autenticar, perfil);

module.exports = router;
