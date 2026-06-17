/**
 * auth.js — Lógica de autenticación del frontend
 * Módulo 3: Lógica con funciones y validaciones
 * Módulo 4: Clases OOP
 */

// ─── Clase Usuario (Módulo 4 – POO) ─────────────────────────────────────────
class Usuario {
  #password; // Campo privado (ES6+)

  constructor({ id, nombre, email, rol, activo }) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.rol = rol;
    this.activo = activo;
  }

  esAdministrador() {
    return this.rol === 'administrador';
  }

  obtenerIniciales() {
    return this.nombre.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }
}

// Clase que extiende Usuario (herencia – Módulo 4)
class Administrador extends Usuario {
  constructor(datos) {
    super(datos);
    this.permisos = ['crear_usuarios', 'eliminar_tareas', 'ver_reportes'];
  }

  tienePermiso(permiso) {
    return this.permisos.includes(permiso);
  }
}

// ─── Gestión de sesión ───────────────────────────────────────────────────────

/**
 * Guarda token y datos de usuario en localStorage
 */
const guardarSesion = ({ token, usuario: datosUsuario }) => {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(datosUsuario));
};

/**
 * Retorna la instancia del usuario de sesión activa
 */
const obtenerUsuarioActual = () => {
  const datos = localStorage.getItem('usuario');
  if (!datos) return null;
  const obj = JSON.parse(datos);
  return obj.rol === 'administrador' ? new Administrador(obj) : new Usuario(obj);
};

/**
 * Verifica si hay sesión activa
 */
const estaAutenticado = () => !!localStorage.getItem('token');

const rutaFrontend = (ruta) => {
  const enPages = window.location.pathname.includes('/pages/');
  return enPages ? `../${ruta}` : ruta;
};

/**
 * Cierra la sesión actual
 */
const cerrarSesion = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = rutaFrontend('pages/login.html');
};

// ─── Validaciones de formularios (Módulo 2 y 3) ──────────────────────────────

/**
 * Valida el formulario de registro
 * Retorna array de errores (vacío si OK)
 */
const validarFormularioRegistro = ({ nombre, email, password, confirmarPassword }) => {
  const errores = [];

  if (!nombre || nombre.trim().length < 2) {
    errores.push('El nombre debe tener al menos 2 caracteres.');
  }

  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !regexEmail.test(email)) {
    errores.push('El email ingresado no es válido.');
  }

  if (!password || password.length < 6) {
    errores.push('La contraseña debe tener al menos 6 caracteres.');
  }

  if (password !== confirmarPassword) {
    errores.push('Las contraseñas no coinciden.');
  }

  return errores;
};

/**
 * Valida el formulario de login
 */
const validarFormularioLogin = ({ email, password }) => {
  const errores = [];
  if (!email) errores.push('El email es requerido.');
  if (!password) errores.push('La contraseña es requerida.');
  return errores;
};

// ─── Inicialización de páginas de auth ───────────────────────────────────────

/**
 * Inicializa la página de login
 */
const inicializarLogin = () => {
  // Si ya está autenticado, redirigir al dashboard
  if (estaAutenticado()) {
    window.location.href = rutaFrontend('index.html');
    return;
  }

  const form = document.getElementById('form-login');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    limpiarAlertas();

    const datos = {
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
    };

    const errores = validarFormularioLogin(datos);
    if (errores.length > 0) {
      mostrarAlerta(errores.join('<br>'), 'danger');
      return;
    }

    try {
      mostrarLoader(true);
      const respuesta = await auth.login(datos);
      guardarSesion(respuesta.datos);
      window.location.href = rutaFrontend('index.html');
    } catch (error) {
      mostrarAlerta(error.mensaje || 'Error al iniciar sesión.', 'danger');
    } finally {
      mostrarLoader(false);
    }
  });
};

/**
 * Inicializa la página de registro
 */
const inicializarRegistro = () => {
  if (estaAutenticado()) {
    window.location.href = rutaFrontend('index.html');
    return;
  }

  const form = document.getElementById('form-registro');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    limpiarAlertas();

    const datos = {
      nombre: document.getElementById('nombre').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      confirmarPassword: document.getElementById('confirmar-password').value,
    };

    const errores = validarFormularioRegistro(datos);
    if (errores.length > 0) {
      mostrarAlerta(errores.join('<br>'), 'danger');
      return;
    }

    try {
      mostrarLoader(true);
      await auth.registro({ nombre: datos.nombre, email: datos.email, password: datos.password });
      mostrarAlerta('Registro exitoso. Redirigiendo...', 'success');
      setTimeout(() => window.location.href = 'login.html', 1500);
    } catch (error) {
      mostrarAlerta(error.mensaje || 'Error al registrarse.', 'danger');
    } finally {
      mostrarLoader(false);
    }
  });
};
