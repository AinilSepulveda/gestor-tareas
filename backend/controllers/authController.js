const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

/**
 * Genera un JWT para el usuario dado
 */
const generarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

/**
 * POST /api/auth/registro
 * Registra un nuevo usuario
 */
const registro = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(409).json({
        exito: false,
        mensaje: 'El email ya está registrado.',
      });
    }

    const nuevoUsuario = await Usuario.create({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password,
      rol: rol === 'administrador' ? 'administrador' : 'usuario',
    });

    const token = generarToken(nuevoUsuario);

    return res.status(201).json({
      exito: true,
      mensaje: 'Usuario registrado exitosamente.',
      datos: {
        usuario: nuevoUsuario,
        token,
      },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    if (error.name === 'SequelizeValidationError') {
      const mensajes = error.errors.map((e) => e.message);
      return res.status(400).json({ exito: false, errores: mensajes });
    }
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

/**
 * POST /api/auth/login
 * Inicia sesión y retorna JWT
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas.',
      });
    }

    const passwordCorrecta = await usuario.compararPassword(password);
    if (!passwordCorrecta) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas.',
      });
    }

    const token = generarToken(usuario);

    return res.status(200).json({
      exito: true,
      mensaje: 'Inicio de sesión exitoso.',
      datos: {
        usuario,
        token,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

/**
 * GET /api/auth/perfil
 * Retorna el perfil del usuario autenticado
 */
const perfil = async (req, res) => {
  try {
    return res.status(200).json({
      exito: true,
      datos: { usuario: req.usuario },
    });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

module.exports = { registro, login, perfil };
