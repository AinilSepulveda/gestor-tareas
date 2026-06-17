const express = require('express');
const router = express.Router();
const {
  listarTareas, obtenerTarea, crearTarea,
  actualizarTarea, eliminarTarea, misTareas,
} = require('../controllers/tareasController');
const { autenticar } = require('../middlewares/autenticacion');
const { validarCrearTarea, validarActualizarTarea } = require('../middlewares/validaciones');

router.get('/', listarTareas);
router.get('/usuario/mis-tareas', autenticar, misTareas);
router.post('/', autenticar, validarCrearTarea, crearTarea);
router.put('/:id', autenticar, validarActualizarTarea, actualizarTarea);
router.delete('/:id', autenticar, eliminarTarea);
router.get('/:id', obtenerTarea);

module.exports = router;
