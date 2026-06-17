/**
 * Middleware de validación para registro de usuario
 */
const validarRegistro = (req, res, next) => {
  const { nombre, email, password } = req.body;
  const errores = [];

  if (!nombre || nombre.trim().length < 2) {
    errores.push('El nombre debe tener al menos 2 caracteres.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errores.push('El email no es válido.');
  }

  if (!password || password.length < 6) {
    errores.push('La contraseña debe tener al menos 6 caracteres.');
  }

  if (errores.length > 0) {
    return res.status(400).json({ exito: false, errores });
  }

  next();
};

/**
 * Middleware de validación para login
 */
const validarLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errores = [];

  if (!email) errores.push('El email es requerido.');
  if (!password) errores.push('La contraseña es requerida.');

  if (errores.length > 0) {
    return res.status(400).json({ exito: false, errores });
  }

  next();
};

/**
 * Middleware de validación para creación/actualización de tarea
 */
const validarTarea = (req, res, next) => {
  const { titulo } = req.body;
  const errores = [];

  if (!titulo || titulo.trim().length < 3) {
    errores.push('El título debe tener al menos 3 caracteres.');
  }

  const estadosValidos = ['pendiente', 'en_progreso', 'completada', 'cancelada'];
  if (req.body.estado && !estadosValidos.includes(req.body.estado)) {
    errores.push('Estado no válido. Opciones: ' + estadosValidos.join(', '));
  }

  const prioridadesValidas = ['baja', 'media', 'alta', 'urgente'];
  if (req.body.prioridad && !prioridadesValidas.includes(req.body.prioridad)) {
    errores.push('Prioridad no válida. Opciones: ' + prioridadesValidas.join(', '));
  }

  if (errores.length > 0) {
    return res.status(400).json({ exito: false, errores });
  }

  next();
};

module.exports = { validarRegistro, validarLogin, validarTarea };
