const express = require('express');
const router = express.Router();
const {
  listarTareas, obtenerTarea, crearTarea,
  actualizarTarea, eliminarTarea, misTareas,
} = require('../controllers/tareasController');
const { autenticar } = require('../middlewares/autenticacion');
const { validarTarea } = require('../middlewares/validaciones');

// Rutas públicas (dashboard)
router.get('/', listarTareas);
router.get('/:id', obtenerTarea);

// Rutas protegidas
router.get('/usuario/mis-tareas', autenticar, misTareas);
router.post('/', autenticar, validarTarea, crearTarea);
router.put('/:id', autenticar, validarTarea, actualizarTarea);
router.delete('/:id', autenticar, eliminarTarea);

module.exports = router;
