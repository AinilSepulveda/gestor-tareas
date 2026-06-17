const { Tarea, Usuario, Nota } = require('../models');
const { Op } = require('sequelize');

const atributosUsuario = ['id', 'nombre', 'email', 'rol'];

const incluirUsuarios = [
  { model: Usuario, as: 'creador', attributes: atributosUsuario },
  { model: Usuario, as: 'asignado', attributes: atributosUsuario },
];

const incluirDetalleTarea = [
  ...incluirUsuarios,
  {
    model: Nota,
    as: 'notas',
    include: [{ model: Usuario, as: 'autor', attributes: atributosUsuario }],
  },
];

const textoOpcional = (valor) => {
  if (valor === undefined) return undefined;
  if (valor === null || valor === '') return null;
  if (typeof valor !== 'string') return valor;

  const limpio = valor.trim();
  return limpio === '' ? null : limpio;
};

const obtenerIdTarea = (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      exito: false,
      mensaje: 'El ID de la tarea debe ser numerico.',
    });
    return null;
  }

  return id;
};

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
      include: incluirUsuarios,
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

const obtenerTarea = async (req, res) => {
  try {
    const id = obtenerIdTarea(req, res);
    if (!id) return;

    const tarea = await Tarea.findByPk(id, {
      include: incluirDetalleTarea,
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

const crearTarea = async (req, res) => {
  try {
    if (req.usuario.rol !== 'administrador') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo un administrador puede crear y asignar tareas.',
      });
    }

    const { titulo, descripcion, prioridad, fecha_vencimiento, asignado_id } = req.body;

    if (!asignado_id) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe asignar la tarea a un usuario.',
      });
    }

    const asignado = await Usuario.findByPk(asignado_id);
    if (!asignado || !asignado.activo) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El usuario asignado no existe o esta inactivo.',
      });
    }

    const nuevaTarea = await Tarea.create({
      titulo: titulo.trim(),
      descripcion: textoOpcional(descripcion) || null,
      estado: 'pendiente',
      prioridad: prioridad || 'media',
      fecha_vencimiento: fecha_vencimiento || null,
      creador_id: req.usuario.id,
      asignado_id,
    });

    const tareaCompleta = await Tarea.findByPk(nuevaTarea.id, {
      include: incluirDetalleTarea,
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

const prepararCambiosAdmin = async (body) => {
  const { titulo, descripcion, estado, prioridad, fecha_vencimiento, asignado_id, notas } = body;

  if (notas !== undefined) {
    return {
      error: {
        codigo: 400,
        mensaje: 'Las notas se gestionan en /api/notas/tarea/:tareaId.',
      },
    };
  }

  const cambios = {};

  if (titulo !== undefined) cambios.titulo = titulo.trim();
  if (descripcion !== undefined) cambios.descripcion = textoOpcional(descripcion);
  if (estado !== undefined) cambios.estado = estado;
  if (prioridad !== undefined) cambios.prioridad = prioridad;
  if (fecha_vencimiento !== undefined) cambios.fecha_vencimiento = fecha_vencimiento || null;

  if (asignado_id !== undefined) {
    if (asignado_id !== null) {
      const asignado = await Usuario.findByPk(asignado_id);
      if (!asignado || !asignado.activo) {
        return {
          error: {
            codigo: 400,
            mensaje: 'El usuario asignado no existe o esta inactivo.',
          },
        };
      }
    }

    cambios.asignado_id = asignado_id;
  }

  if (Object.keys(cambios).length === 0) {
    return {
      error: {
        codigo: 400,
        mensaje: 'El administrador debe enviar al menos un campo para actualizar.',
      },
    };
  }

  return { cambios };
};

const prepararCambiosUsuario = (body) => {
  const { titulo, descripcion, estado, prioridad, fecha_vencimiento, asignado_id, notas } = body;

  if (notas !== undefined) {
    return {
      error: {
        codigo: 400,
        mensaje: 'Las notas se gestionan en /api/notas/tarea/:tareaId.',
      },
    };
  }

  if (titulo !== undefined || descripcion !== undefined || prioridad !== undefined || fecha_vencimiento !== undefined || asignado_id !== undefined) {
    return {
      error: {
        codigo: 403,
        mensaje: 'Solo un administrador puede editar el contenido o la asignacion de la tarea.',
      },
    };
  }

  if (estado === undefined) {
    return {
      error: {
        codigo: 400,
        mensaje: 'Debe enviar estado para actualizar la tarea.',
      },
    };
  }

  return { cambios: { estado } };
};

const actualizarTarea = async (req, res) => {
  try {
    const id = obtenerIdTarea(req, res);
    if (!id) return;

    const tarea = await Tarea.findByPk(id);

    if (!tarea) {
      return res.status(404).json({ exito: false, mensaje: 'Tarea no encontrada.' });
    }

    const esAdmin = req.usuario.rol === 'administrador';
    const esAsignado = tarea.asignado_id === req.usuario.id;

    if (!esAdmin) {
      if (!esAsignado) {
        return res.status(403).json({
          exito: false,
          mensaje: 'Solo el usuario asignado puede mover el estado de esta tarea.',
        });
      }
    }

    const resultado = esAdmin
      ? await prepararCambiosAdmin(req.body)
      : prepararCambiosUsuario(req.body);

    if (resultado.error) {
      return res.status(resultado.error.codigo).json({
        exito: false,
        mensaje: resultado.error.mensaje,
      });
    }

    await tarea.update(resultado.cambios);

    const tareaActualizada = await Tarea.findByPk(tarea.id, {
      include: incluirDetalleTarea,
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

const eliminarTarea = async (req, res) => {
  try {
    const id = obtenerIdTarea(req, res);
    if (!id) return;

    const tarea = await Tarea.findByPk(id);

    if (!tarea) {
      return res.status(404).json({ exito: false, mensaje: 'Tarea no encontrada.' });
    }

    if (req.usuario.rol !== 'administrador') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo un administrador puede eliminar tareas.',
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

const misTareas = async (req, res) => {
  try {
    const tareas = await Tarea.findAll({
      where: {
        [Op.or]: [
          { creador_id: req.usuario.id },
          { asignado_id: req.usuario.id },
        ],
      },
      include: incluirUsuarios,
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
