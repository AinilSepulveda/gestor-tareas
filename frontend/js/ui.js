/**
 * ui.js — Utilidades de interfaz compartidas
 */

/**
 * Muestra u oculta el loader de pantalla completa
 */
const mostrarLoader = (mostrar) => {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = mostrar ? 'flex' : 'none';
};

/**
 * Muestra una alerta flotante en la esquina superior derecha
 */
const mostrarAlerta = (mensaje, tipo = 'info', duracion = 4000) => {
  const container = document.getElementById('alerta-container');
  if (!container) return;

  const alerta = document.createElement('div');
  alerta.className = `alert alert-${tipo} alert-dismissible fade show shadow`;
  alerta.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  container.appendChild(alerta);

  if (duracion > 0) {
    setTimeout(() => {
      alerta.classList.remove('show');
      setTimeout(() => alerta.remove(), 300);
    }, duracion);
  }
};

const limpiarAlertas = () => {
  const container = document.getElementById('alerta-container');
  if (container) container.innerHTML = '';
};

/**
 * Formatea una fecha ISO a formato legible en español
 */
const formatearFecha = (fecha) => {
  if (!fecha) return '—';
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

/**
 * Retorna el badge HTML de estado
 */
const badgeEstado = (estado) => {
  const etiquetas = {
    pendiente:   'Pendiente',
    en_progreso: 'En Progreso',
    completada:  'Completada',
    cancelada:   'Cancelada',
  };
  return `<span class="badge badge-${estado}">${etiquetas[estado] || estado}</span>`;
};

/**
 * Retorna el badge HTML de prioridad
 */
const badgePrioridad = (prioridad) => {
  const etiquetas = { baja: 'Baja', media: 'Media', alta: 'Alta', urgente: 'Urgente' };
  return `<span class="badge badge-${prioridad}">${etiquetas[prioridad] || prioridad}</span>`;
};

/**
 * Actualiza el navbar con datos del usuario autenticado
 */
const actualizarNavbar = () => {
  const usuario = obtenerUsuarioActual();
  const navUsuario = document.getElementById('nav-usuario');
  const navAdmin   = document.getElementById('nav-admin');
  const btnLogout  = document.getElementById('btn-logout');

  if (!estaAutenticado()) {
    if (navUsuario) navUsuario.style.display = 'none';
    return;
  }

  if (navUsuario && usuario) {
    navUsuario.textContent = usuario.nombre;
  }
  if (navAdmin && usuario && usuario.esAdministrador()) {
    navAdmin.style.display = 'block';
  }
  if (btnLogout) {
    btnLogout.addEventListener('click', cerrarSesion);
  }
};
