/**
 * dashboard.js — Lógica del dashboard principal
 * Módulo 4: Consume API de JSONPlaceholder y API REST propia
 * Módulo 8: Consume API REST con JWT
 */

let tareasCache = [];
let paginaActual = 1;
const LIMITE = 8;

/**
 * Carga las estadísticas de tareas
 */
const cargarEstadisticas = async () => {
  try {
    const respuesta = await tareas.listar('limit=1000');
    const todas = respuesta.datos.tareas;

    const conteo = { pendiente: 0, en_progreso: 0, completada: 0, cancelada: 0 };
    todas.forEach(t => {
      if (conteo[t.estado] !== undefined) conteo[t.estado]++;
    });

    document.getElementById('stat-total').textContent     = todas.length;
    document.getElementById('stat-pendiente').textContent = conteo.pendiente;
    document.getElementById('stat-progreso').textContent  = conteo.en_progreso;
    document.getElementById('stat-completada').textContent= conteo.completada;
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
};

/**
 * Renderiza la tabla de tareas
 */
const renderizarTabla = (listaTareas) => {
  const tbody = document.getElementById('tabla-tareas-body');
  if (!tbody) return;

  if (listaTareas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted py-4">
          <i class="bi bi-inbox fs-3 d-block mb-2"></i>
          No hay tareas que mostrar.
        </td>
      </tr>`;
    return;
  }

  const usuario = obtenerUsuarioActual();

  tbody.innerHTML = listaTareas.map(t => `
    <tr>
      <td><strong>${t.titulo}</strong></td>
      <td>${badgeEstado(t.estado)}</td>
      <td>${badgePrioridad(t.prioridad)}</td>
      <td>${t.asignado ? t.asignado.nombre : '<span class="text-muted">Sin asignar</span>'}</td>
      <td>${formatearFecha(t.fecha_vencimiento)}</td>
      <td>
        ${estaAutenticado() ? `
          <button class="btn btn-sm btn-outline-primary me-1" onclick="abrirModalEditar(${t.id})" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="confirmarEliminar(${t.id})" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        ` : '<span class="text-muted small">—</span>'}
      </td>
    </tr>
  `).join('');
};

/**
 * Carga y muestra tareas desde la API propia
 */
const cargarTareas = async (pagina = 1) => {
  try {
    mostrarLoader(true);
    const estado    = document.getElementById('filtro-estado')?.value || '';
    const prioridad = document.getElementById('filtro-prioridad')?.value || '';

    let params = `page=${pagina}&limit=${LIMITE}`;
    if (estado)    params += `&estado=${estado}`;
    if (prioridad) params += `&prioridad=${prioridad}`;

    const respuesta = await tareas.listar(params);
    tareasCache = respuesta.datos.tareas;
    paginaActual = pagina;

    renderizarTabla(tareasCache);
    renderizarPaginacion(respuesta.datos.paginacion);
  } catch (error) {
    mostrarAlerta('Error al cargar las tareas.', 'danger');
  } finally {
    mostrarLoader(false);
  }
};

/**
 * Renderiza controles de paginación
 */
const renderizarPaginacion = ({ pagina, totalPaginas }) => {
  const nav = document.getElementById('paginacion');
  if (!nav || totalPaginas <= 1) { if (nav) nav.innerHTML = ''; return; }

  let html = '';
  for (let i = 1; i <= totalPaginas; i++) {
    html += `<li class="page-item ${i === pagina ? 'active' : ''}">
      <button class="page-link" onclick="cargarTareas(${i})">${i}</button>
    </li>`;
  }
  nav.innerHTML = `<ul class="pagination pagination-sm justify-content-center mb-0">${html}</ul>`;
};

/**
 * Carga tareas desde JSONPlaceholder (Módulo 4)
 * Simula que los posts son tareas externas
 */
const cargarTareasExternas = async () => {
  const contenedor = document.getElementById('tareas-externas');
  if (!contenedor) return;

  try {
    const posts = await tareasExternas();
    contenedor.innerHTML = posts.map(post => `
      <div class="col-md-6 col-lg-4 mb-3">
        <div class="card h-100">
          <div class="card-body">
            <h6 class="card-title text-capitalize">${post.title.substring(0, 50)}...</h6>
            <p class="card-text text-muted small">${post.body.substring(0, 80)}...</p>
            <span class="badge bg-secondary">JSONPlaceholder #${post.id}</span>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    contenedor.innerHTML = '<p class="text-muted">No se pudo cargar tareas externas.</p>';
  }
};

const resetearFormularioTarea = () => {
  document.getElementById('tarea-id').value = '';
  document.getElementById('tarea-titulo').value = '';
  document.getElementById('tarea-descripcion').value = '';
  document.getElementById('tarea-estado').value = 'pendiente';
  document.getElementById('tarea-prioridad').value = 'media';
  document.getElementById('tarea-vencimiento').value = '';
  document.getElementById('tarea-asignado').value = '';
};

/**
 * Abre el modal para crear una nueva tarea
 */
const abrirModalCrear = async () => {
  if (!estaAutenticado()) {
    mostrarAlerta('Debes iniciar sesión para crear tareas.', 'warning');
    return;
  }
  await cargarUsuariosEnSelect();
  document.getElementById('modal-titulo').textContent = 'Nueva Tarea';
  resetearFormularioTarea();
  const modal = new bootstrap.Modal(document.getElementById('modal-tarea'));
  modal.show();
};

/**
 * Abre el modal para editar una tarea existente
 */
const abrirModalEditar = async (id) => {
  if (!estaAutenticado()) return;
  try {
    mostrarLoader(true);
    await cargarUsuariosEnSelect();
    const resp = await tareas.obtener(id);
    const t = resp.datos.tarea;

    document.getElementById('modal-titulo').textContent = 'Editar Tarea';
    document.getElementById('tarea-id').value = t.id;
    document.getElementById('tarea-titulo').value = t.titulo;
    document.getElementById('tarea-descripcion').value = t.descripcion || '';
    document.getElementById('tarea-estado').value = t.estado;
    document.getElementById('tarea-prioridad').value = t.prioridad;
    document.getElementById('tarea-vencimiento').value = t.fecha_vencimiento || '';
    document.getElementById('tarea-asignado').value = t.asignado_id || '';

    const modal = new bootstrap.Modal(document.getElementById('modal-tarea'));
    modal.show();
  } catch (error) {
    mostrarAlerta('Error al cargar la tarea.', 'danger');
  } finally {
    mostrarLoader(false);
  }
};

/**
 * Carga los usuarios en el select del formulario de tarea
 */
const cargarUsuariosEnSelect = async () => {
  const select = document.getElementById('tarea-asignado');
  if (!select) return;
  select.innerHTML = '<option value="">Sin asignar</option>';

  const usuario = obtenerUsuarioActual();
  if (!usuario?.esAdministrador()) return;

  try {
    const resp = await usuarios.listar();
    select.innerHTML +=
      resp.datos.usuarios.map(u =>
        `<option value="${u.id}">${u.nombre}</option>`
      ).join('');
  } catch {
    select.innerHTML = '<option value="">Sin asignar</option>';
  }
};

/**
 * Guarda la tarea (crea o actualiza)
 */
const guardarTarea = async () => {
  const id = document.getElementById('tarea-id').value;
  const datos = {
    titulo:           document.getElementById('tarea-titulo').value.trim(),
    descripcion:      document.getElementById('tarea-descripcion').value.trim(),
    estado:           document.getElementById('tarea-estado').value,
    prioridad:        document.getElementById('tarea-prioridad').value,
    fecha_vencimiento:document.getElementById('tarea-vencimiento').value || null,
    asignado_id:      document.getElementById('tarea-asignado').value || null,
  };

  if (!datos.titulo || datos.titulo.length < 3) {
    mostrarAlerta('El título debe tener al menos 3 caracteres.', 'warning');
    return;
  }

  try {
    mostrarLoader(true);
    if (id) {
      await tareas.actualizar(id, datos);
      mostrarAlerta('Tarea actualizada correctamente.', 'success');
    } else {
      await tareas.crear(datos);
      mostrarAlerta('Tarea creada correctamente.', 'success');
    }

    bootstrap.Modal.getInstance(document.getElementById('modal-tarea')).hide();
    await cargarTareas(paginaActual);
    await cargarEstadisticas();
  } catch (error) {
    mostrarAlerta(error.mensaje || 'Error al guardar la tarea.', 'danger');
  } finally {
    mostrarLoader(false);
  }
};

/**
 * Confirma y elimina una tarea
 */
const confirmarEliminar = async (id) => {
  if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) return;
  try {
    mostrarLoader(true);
    await tareas.eliminar(id);
    mostrarAlerta('Tarea eliminada correctamente.', 'success');
    await cargarTareas(paginaActual);
    await cargarEstadisticas();
  } catch (error) {
    mostrarAlerta(error.mensaje || 'Error al eliminar la tarea.', 'danger');
  } finally {
    mostrarLoader(false);
  }
};

/**
 * Inicialización del dashboard
 */
document.addEventListener('DOMContentLoaded', async () => {
  actualizarNavbar();

  // Mostrar botón crear solo si está autenticado
  const btnCrear = document.getElementById('btn-crear-tarea');
  if (btnCrear) {
    btnCrear.style.display = estaAutenticado() ? 'inline-block' : 'none';
    btnCrear.addEventListener('click', abrirModalCrear);
  }

  // Botón guardar tarea
  const btnGuardar = document.getElementById('btn-guardar-tarea');
  if (btnGuardar) btnGuardar.addEventListener('click', guardarTarea);

  // Filtros
  ['filtro-estado', 'filtro-prioridad'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => cargarTareas(1));
  });

  // Cargar datos
  await Promise.all([
    cargarEstadisticas(),
    cargarTareas(),
    cargarTareasExternas(),
  ]);
});
