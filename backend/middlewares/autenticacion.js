const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

/**
 * Middleware de autenticación JWT
 * Verifica el token en el header Authorization: Bearer <token>
 */
const autenticar = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Acceso denegado. Token no proporcionado.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await Usuario.findByPk(decoded.id);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Token inválido o usuario inactivo.',
      });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ exito: false, mensaje: 'Token expirado.' });
    }
    return res.status(401).json({ exito: false, mensaje: 'Token inválido.' });
  }
};

/**
 * Middleware de autorización por rol
 * Uso: soloAdmin
 */
const soloAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({
      exito: false,
      mensaje: 'Acceso denegado. Se requiere rol de administrador.',
    });
  }
  next();
};

module.exports = { autenticar, soloAdmin };
