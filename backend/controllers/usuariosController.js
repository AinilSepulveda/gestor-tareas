const { Usuario, Tarea } = require('../models');

/**
 * GET /api/usuarios (solo admin)
 * Lista todos los usuarios
 */
const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'nombre', 'email', 'rol', 'activo', 'createdAt'],
      order: [['nombre', 'ASC']],
    });

    return res.status(200).json({
      exito: true,
      datos: { usuarios, total: usuarios.length },
    });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

/**
 * GET /api/usuarios/:id (protegido - admin o el propio usuario)
 */
const obtenerUsuario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (req.usuario.rol !== 'administrador' && req.usuario.id !== id) {
      return res.status(403).json({ exito: false, mensaje: 'Acceso denegado.' });
    }

    const usuario = await Usuario.findByPk(id, {
      attributes: ['id', 'nombre', 'email', 'rol', 'activo', 'createdAt'],
    });

    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado.' });
    }

    return res.status(200).json({ exito: true, datos: { usuario } });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

/**
 * PUT /api/usuarios/:id (protegido - admin o el propio usuario)
 */
const actualizarUsuario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (req.usuario.rol !== 'administrador' && req.usuario.id !== id) {
      return res.status(403).json({ exito: false, mensaje: 'Acceso denegado.' });
    }

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado.' });
    }

    const { nombre, email, password } = req.body;

    await usuario.update({
      nombre: nombre ? nombre.trim() : usuario.nombre,
      email: email ? email.toLowerCase().trim() : usuario.email,
      password: password || usuario.password,
    });

    return res.status(200).json({
      exito: true,
      mensaje: 'Usuario actualizado exitosamente.',
      datos: { usuario },
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ exito: false, errores: error.errors.map(e => e.message) });
    }
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

/**
 * DELETE /api/usuarios/:id (solo admin)
 * Desactiva un usuario (soft delete)
 */
const desactivarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado.' });
    }

    await usuario.update({ activo: false });

    return res.status(200).json({
      exito: true,
      mensaje: 'Usuario desactivado exitosamente.',
    });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

module.exports = { listarUsuarios, obtenerUsuario, actualizarUsuario, desactivarUsuario };
