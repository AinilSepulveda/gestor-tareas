const estadosValidos = ['pendiente', 'en_progreso', 'revision', 'completada', 'cancelada'];
const prioridadesValidas = ['baja', 'media', 'alta', 'urgente'];

/**
 * Middleware de validacion para registro de usuario
 */
const validarRegistro = (req, res, next) => {
  const { nombre, email, password } = req.body;
  const errores = [];

  if (!nombre || nombre.trim().length < 2) {
    errores.push('El nombre debe tener al menos 2 caracteres.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errores.push('El email no es valido.');
  }

  if (!password || password.length < 6) {
    errores.push('La contrasena debe tener al menos 6 caracteres.');
  }

  if (errores.length > 0) {
    return res.status(400).json({ exito: false, errores });
  }

  next();
};

/**
 * Middleware de validacion para login
 */
const validarLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errores = [];

  if (!email) errores.push('El email es requerido.');
  if (!password) errores.push('La contrasena es requerida.');

  if (errores.length > 0) {
    return res.status(400).json({ exito: false, errores });
  }

  next();
};

const validarCamposTarea = (req, errores, { tituloRequerido }) => {
  const { titulo } = req.body;

  if (tituloRequerido && (!titulo || titulo.trim().length < 3)) {
    errores.push('El titulo debe tener al menos 3 caracteres.');
  }

  if (!tituloRequerido && titulo !== undefined && titulo.trim().length < 3) {
    errores.push('El titulo debe tener al menos 3 caracteres.');
  }

  if (req.body.estado && !estadosValidos.includes(req.body.estado)) {
    errores.push('Estado no valido. Opciones: ' + estadosValidos.join(', '));
  }

  if (req.body.prioridad && !prioridadesValidas.includes(req.body.prioridad)) {
    errores.push('Prioridad no valida. Opciones: ' + prioridadesValidas.join(', '));
  }
};

/**
 * Middleware de validacion para creacion de tarea
 */
const validarCrearTarea = (req, res, next) => {
  const errores = [];

  validarCamposTarea(req, errores, { tituloRequerido: true });

  if (errores.length > 0) {
    return res.status(400).json({ exito: false, errores });
  }

  next();
};

/**
 * Middleware de validacion para actualizacion de tarea
 */
const validarActualizarTarea = (req, res, next) => {
  const errores = [];

  validarCamposTarea(req, errores, { tituloRequerido: false });

  if (Object.keys(req.body).length === 0) {
    errores.push('Debe enviar al menos un campo para actualizar.');
  }

  if (errores.length > 0) {
    return res.status(400).json({ exito: false, errores });
  }

  next();
};

module.exports = { validarRegistro, validarLogin, validarCrearTarea, validarActualizarTarea };
