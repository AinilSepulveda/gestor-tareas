const { Tarea, Usuario } = require('../models');
const { Op } = require('sequelize');

// Atributos seguros para incluir de un usuario
const atributosUsuario = ['id', 'nombre', 'email', 'rol'];

/**
 * GET /api/tareas (público - para el dashboard)
 * Lista todas las tareas con filtros opcionales
 */
const listarTareas = async (req, res) => {
  try {
    const { estado, prioridad, asignado_id, page = 1, limit = 10 } = req.query;
    const where = {};

    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;
    if (asignado_id) where.asignado_id = asignado_id;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: tareas } = await Tarea.findAndCountAll({
      where,
      include: [
        { model: Usuario, as: 'creador', attributes: atributosUsuario },
        { model: Usuario, as: 'asignado', attributes: atributosUsuario },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return res.status(200).json({
      exito: true,
      datos: {
        tareas,
        paginacion: {
          total: count,
          pagina: parseInt(page),
          limite: parseInt(limit),
          totalPaginas: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error al listar tareas:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

/**
 * GET /api/tareas/:id (público)
 * Obtiene una tarea por ID
 */
const obtenerTarea = async (req, res) => {
  try {
    const tarea = await Tarea.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: 'creador', attributes: atributosUsuario },
        { model: Usuario, as: 'asignado', attributes: atributosUsuario },
      ],
    });

    if (!tarea) {
      return res.status(404).json({ exito: false, mensaje: 'Tarea no encontrada.' });
    }

    return res.status(200).json({ exito: true, datos: { tarea } });
  } catch (error) {
    console.error('Error al obtener tarea:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

/**
 * POST /api/tareas (protegido)
 * Crea una nueva tarea
 */
const crearTarea = async (req, res) => {
  try {
    const { titulo, descripcion, estado, prioridad, fecha_vencimiento, asignado_id } = req.body;

    // Verificar que el asignado exista si se proporcionó
    if (asignado_id) {
      const asignado = await Usuario.findByPk(asignado_id);
      if (!asignado) {
        return res.status(400).json({ exito: false, mensaje: 'El usuario asignado no existe.' });
      }
    }

    const nuevaTarea = await Tarea.create({
      titulo: titulo.trim(),
      descripcion: descripcion ? descripcion.trim() : null,
      estado: estado || 'pendiente',
      prioridad: prioridad || 'media',
      fecha_vencimiento: fecha_vencimiento || null,
      creador_id: req.usuario.id,
      asignado_id: asignado_id || null,
    });

    // Recargar con asociaciones
    const tareaCompleta = await Tarea.findByPk(nuevaTarea.id, {
      include: [
        { model: Usuario, as: 'creador', attributes: atributosUsuario },
        { model: Usuario, as: 'asignado', attributes: atributosUsuario },
      ],
    });

    return res.status(201).json({
      exito: true,
      mensaje: 'Tarea creada exitosamente.',
      datos: { tarea: tareaCompleta },
    });
  } catch (error) {
    console.error('Error al crear tarea:', error);
    if (error.name === 'SequelizeValidationError') {
      const mensajes = error.errors.map((e) => e.message);
      return res.status(400).json({ exito: false, errores: mensajes });
    }
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

/**
 * PUT /api/tareas/:id (protegido)
 * Actualiza una tarea existente
 */
const actualizarTarea = async (req, res) => {
  try {
    const tarea = await Tarea.findByPk(req.params.id);

    if (!tarea) {
      return res.status(404).json({ exito: false, mensaje: 'Tarea no encontrada.' });
    }

    // Solo el creador o un administrador puede editar
    if (tarea.creador_id !== req.usuario.id && req.usuario.rol !== 'administrador') {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permiso para editar esta tarea.',
      });
    }

    const { titulo, descripcion, estado, prioridad, fecha_vencimiento, asignado_id } = req.body;

    await tarea.update({
      titulo: titulo ? titulo.trim() : tarea.titulo,
      descripcion: descripcion !== undefined ? descripcion : tarea.descripcion,
      estado: estado || tarea.estado,
      prioridad: prioridad || tarea.prioridad,
      fecha_vencimiento: fecha_vencimiento !== undefined ? fecha_vencimiento : tarea.fecha_vencimiento,
      asignado_id: asignado_id !== undefined ? asignado_id : tarea.asignado_id,
    });

    const tareaActualizada = await Tarea.findByPk(tarea.id, {
      include: [
        { model: Usuario, as: 'creador', attributes: atributosUsuario },
        { model: Usuario, as: 'asignado', attributes: atributosUsuario },
      ],
    });

    return res.status(200).json({
      exito: true,
      mensaje: 'Tarea actualizada exitosamente.',
      datos: { tarea: tareaActualizada },
    });
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    if (error.name === 'SequelizeValidationError') {
      const mensajes = error.errors.map((e) => e.message);
      return res.status(400).json({ exito: false, errores: mensajes });
    }
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

/**
 * DELETE /api/tareas/:id (protegido)
 * Elimina una tarea
 */
const eliminarTarea = async (req, res) => {
  try {
    const tarea = await Tarea.findByPk(req.params.id);

    if (!tarea) {
      return res.status(404).json({ exito: false, mensaje: 'Tarea no encontrada.' });
    }

    // Solo el creador o un administrador puede eliminar
    if (tarea.creador_id !== req.usuario.id && req.usuario.rol !== 'administrador') {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permiso para eliminar esta tarea.',
      });
    }

    await tarea.destroy();

    return res.status(200).json({
      exito: true,
      mensaje: 'Tarea eliminada exitosamente.',
    });
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

/**
 * GET /api/tareas/mis-tareas (protegido)
 * Tareas del usuario autenticado
 */
const misTareas = async (req, res) => {
  try {
    const tareas = await Tarea.findAll({
      where: {
        [Op.or]: [
          { creador_id: req.usuario.id },
          { asignado_id: req.usuario.id },
        ],
      },
      include: [
        { model: Usuario, as: 'creador', attributes: atributosUsuario },
        { model: Usuario, as: 'asignado', attributes: atributosUsuario },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      exito: true,
      datos: { tareas, total: tareas.length },
    });
  } catch (error) {
    console.error('Error al obtener mis tareas:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

module.exports = { listarTareas, obtenerTarea, crearTarea, actualizarTarea, eliminarTarea, misTareas };
