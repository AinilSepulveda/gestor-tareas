const express = require('express');
const router = express.Router();
const {
  listarNotasPorTarea,
  crearNota,
  obtenerNota,
  actualizarNota,
  eliminarNota,
} = require('../controllers/notasController');
const { autenticar } = require('../middlewares/autenticacion');

router.get('/tarea/:tareaId', listarNotasPorTarea);
router.get('/:id', obtenerNota);
router.post('/tarea/:tareaId', autenticar, crearNota);
router.put('/:id', autenticar, actualizarNota);
router.delete('/:id', autenticar, eliminarNota);

module.exports = router;
