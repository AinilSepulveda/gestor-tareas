const { Nota, Tarea, Usuario } = require('../models');

const atributosUsuario = ['id', 'nombre', 'email', 'rol'];

const obtenerId = (valor) => {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const textoNota = (texto) => {
  if (typeof texto !== 'string') return null;

  const limpio = texto.trim();
  return limpio.length > 0 ? limpio : null;
};

const usuarioPuedeVerTarea = (usuario, tarea) => {
  return usuario.rol === 'administrador'
    || tarea.creador_id === usuario.id
    || tarea.asignado_id === usuario.id;
};

const usuarioPuedeCrearNota = (usuario, tarea) => {
  return usuario.rol === 'administrador' || tarea.asignado_id === usuario.id;
};

const buscarTareaPublica = async (req, res) => {
  const tareaId = obtenerId(req.params.tareaId);

  if (!tareaId) {
    res.status(400).json({ exito: false, mensaje: 'El ID de la tarea debe ser numerico.' });
    return null;
  }

  const tarea = await Tarea.findByPk(tareaId);

  if (!tarea) {
    res.status(404).json({ exito: false, mensaje: 'Tarea no encontrada.' });
    return null;
  }

  return tarea;
};

const buscarTareaConAcceso = async (req, res, { requiereCrear = false } = {}) => {
  const tareaId = obtenerId(req.params.tareaId);

  if (!tareaId) {
    res.status(400).json({ exito: false, mensaje: 'El ID de la tarea debe ser numerico.' });
    return null;
  }

  const tarea = await Tarea.findByPk(tareaId);

  if (!tarea) {
    res.status(404).json({ exito: false, mensaje: 'Tarea no encontrada.' });
    return null;
  }

  const tieneAcceso = requiereCrear
    ? usuarioPuedeCrearNota(req.usuario, tarea)
    : usuarioPuedeVerTarea(req.usuario, tarea);

  if (!tieneAcceso) {
    res.status(403).json({ exito: false, mensaje: 'No tienes permiso para gestionar notas de esta tarea.' });
    return null;
  }

  return tarea;
};

const incluirAutorYTarea = [
  { model: Usuario, as: 'autor', attributes: atributosUsuario },
  { model: Tarea, as: 'tarea' },
];

const listarNotasPorTarea = async (req, res) => {
  try {
    const tarea = await buscarTareaPublica(req, res);
    if (!tarea) return;

    const notas = await Nota.findAll({
      where: { tarea_id: tarea.id },
      include: [{ model: Usuario, as: 'autor', attributes: atributosUsuario }],
      order: [['createdAt', 'ASC']],
    });

    return res.status(200).json({
      exito: true,
      datos: { notas, total: notas.length },
    });
  } catch (error) {
    console.error('Error al listar notas:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

const crearNota = async (req, res) => {
  try {
    const tarea = await buscarTareaConAcceso(req, res, { requiereCrear: true });
    if (!tarea) return;

    const texto = textoNota(req.body.texto);
    if (!texto) {
      return res.status(400).json({ exito: false, mensaje: 'La nota no puede estar vacia.' });
    }

    const nuevaNota = await Nota.create({
      texto,
      tarea_id: tarea.id,
      usuario_id: req.usuario.id,
    });

    const notaCompleta = await Nota.findByPk(nuevaNota.id, {
      include: incluirAutorYTarea,
    });

    return res.status(201).json({
      exito: true,
      mensaje: 'Nota creada exitosamente.',
      datos: { nota: notaCompleta },
    });
  } catch (error) {
    console.error('Error al crear nota:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ exito: false, errores: error.errors.map((e) => e.message) });
    }
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

const obtenerNota = async (req, res) => {
  try {
    const notaId = obtenerId(req.params.id);
    if (!notaId) {
      return res.status(400).json({ exito: false, mensaje: 'El ID de la nota debe ser numerico.' });
    }

    const nota = await Nota.findByPk(notaId, {
      include: incluirAutorYTarea,
    });

    if (!nota) {
      return res.status(404).json({ exito: false, mensaje: 'Nota no encontrada.' });
    }

    return res.status(200).json({ exito: true, datos: { nota } });
  } catch (error) {
    console.error('Error al obtener nota:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

const actualizarNota = async (req, res) => {
  try {
    const notaId = obtenerId(req.params.id);
    if (!notaId) {
      return res.status(400).json({ exito: false, mensaje: 'El ID de la nota debe ser numerico.' });
    }

    const nota = await Nota.findByPk(notaId, {
      include: [{ model: Tarea, as: 'tarea' }],
    });

    if (!nota) {
      return res.status(404).json({ exito: false, mensaje: 'Nota no encontrada.' });
    }

    const puedeEditar = req.usuario.rol === 'administrador' || nota.usuario_id === req.usuario.id;
    if (!puedeEditar) {
      return res.status(403).json({ exito: false, mensaje: 'No tienes permiso para editar esta nota.' });
    }

    const texto = textoNota(req.body.texto);
    if (!texto) {
      return res.status(400).json({ exito: false, mensaje: 'La nota no puede estar vacia.' });
    }

    await nota.update({ texto });

    const notaActualizada = await Nota.findByPk(nota.id, {
      include: incluirAutorYTarea,
    });

    return res.status(200).json({
      exito: true,
      mensaje: 'Nota actualizada exitosamente.',
      datos: { nota: notaActualizada },
    });
  } catch (error) {
    console.error('Error al actualizar nota:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ exito: false, errores: error.errors.map((e) => e.message) });
    }
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

const eliminarNota = async (req, res) => {
  try {
    const notaId = obtenerId(req.params.id);
    if (!notaId) {
      return res.status(400).json({ exito: false, mensaje: 'El ID de la nota debe ser numerico.' });
    }

    const nota = await Nota.findByPk(notaId, {
      include: [{ model: Tarea, as: 'tarea' }],
    });

    if (!nota) {
      return res.status(404).json({ exito: false, mensaje: 'Nota no encontrada.' });
    }

    const puedeEliminar = req.usuario.rol === 'administrador' || nota.usuario_id === req.usuario.id;
    if (!puedeEliminar) {
      return res.status(403).json({ exito: false, mensaje: 'No tienes permiso para eliminar esta nota.' });
    }

    await nota.destroy();

    return res.status(200).json({
      exito: true,
      mensaje: 'Nota eliminada exitosamente.',
    });
  } catch (error) {
    console.error('Error al eliminar nota:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

module.exports = { listarNotasPorTarea, crearNota, obtenerNota, actualizarNota, eliminarNota };
