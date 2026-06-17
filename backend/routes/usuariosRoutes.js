const express = require('express');
const router = express.Router();
const {
  listarUsuarios, obtenerUsuario, actualizarUsuario, desactivarUsuario,
} = require('../controllers/usuariosController');
const { autenticar, soloAdmin } = require('../middlewares/autenticacion');

// Todas las rutas de usuarios requieren autenticación
router.use(autenticar);

router.get('/', soloAdmin, listarUsuarios);
router.get('/:id', obtenerUsuario);
router.put('/:id', actualizarUsuario);
router.delete('/:id', soloAdmin, desactivarUsuario);

module.exports = router;
