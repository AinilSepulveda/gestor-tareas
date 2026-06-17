/**
 * Dashboard principal:
 * - carga tareas y estadisticas
 * - renderiza el tablero por estado
 * - coordina el modal de tareas
 */

const LIMITE = 8;
const ESTADOS_TAREA = [
  { id: 'pendiente', etiqueta: 'Pendiente' },
  { id: 'en_progreso', etiqueta: 'En Progreso' },
  { id: 'revision', etiqueta: 'Revision' },
  { id: 'completada', etiqueta: 'Completada' },
  { id: 'cancelada', etiqueta: 'Cancelada' },
];

let tareasCache = [];
let paginaActual = 1;

const $ = (id) => document.getElementById(id);

const obtenerTareaCache = (id) => tareasCache.find(tarea => tarea.id === id);

const cargarEstadisticas = async () => {
  try {
    const respuesta = await tareas.listar('limit=1000');
    const todas = respuesta.datos.tareas;
    const conteo = { pendiente: 0, en_progreso: 0, revision: 0, completada: 0, cancelada: 0 };

    todas.forEach(tarea => {
      if (conteo[tarea.estado] !== undefined) conteo[tarea.estado]++;
    });

    $('stat-total').textContent = todas.length;
    $('stat-pendiente').textContent = conteo.pendiente;
    $('stat-progreso').textContent = conteo.en_progreso;
    $('stat-revision').textContent = conteo.revision;
    $('stat-completada').textContent = conteo.completada;
  } catch (error) {
    console.error('Error al cargar estadisticas:', error);
  }
};

const renderizarAccionesTarea = (tarea, usuario) => {
  if (!estaAutenticado()) return '<span class="text-muted small">Solo lectura</span>';

  const acciones = [];
  if (puedeAbrirEditorTarea(tarea, usuario)) {
    acciones.push(`
      <button class="btn btn-sm btn-outline-primary" onclick="abrirModalEditar(${tarea.id})" title="Editar">
        <i class="bi bi-pencil"></i>
      </button>
    `);
  }

  if (puedeEliminarTarea(usuario)) {
    acciones.push(`
      <button class="btn btn-sm btn-outline-danger" onclick="confirmarEliminar(${tarea.id})" title="Eliminar">
        <i class="bi bi-trash"></i>
      </button>
    `);
  }

  return acciones.length ? acciones.join('') : '<span class="text-muted small">Sin acciones</span>';
};

const renderizarTarjetaTarea = (tarea, notasTarea, usuario) => `
  <article class="task-card">
    <div class="task-card__body">
      <div class="d-flex justify-content-between align-items-start gap-2">
        <h3 class="task-card__title">${escaparHtml(tarea.titulo)}</h3>
        ${badgePrioridad(tarea.prioridad)}
      </div>
      ${tarea.descripcion ? `<p class="task-card__description">${escaparHtml(tarea.descripcion)}</p>` : ''}
      <div class="task-card__meta">
        <span><i class="bi bi-person me-1"></i>${tarea.asignado ? escaparHtml(tarea.asignado.nombre) : 'Sin asignar'}</span>
        <span><i class="bi bi-calendar-event me-1"></i>${formatearFecha(tarea.fecha_vencimiento)}</span>
      </div>
      <div class="task-card__badges">
        ${badgeEstado(tarea.estado)}
      </div>
      <div class="task-card__actions">
        ${renderizarAccionesTarea(tarea, usuario)}
      </div>
    </div>
    ${renderizarNotas(tarea, notasTarea, usuario)}
  </article>
`;

const renderizarTablero = async (listaTareas) => {
  const tablero = $('tablero-tareas');
  if (!tablero) return;

  if (listaTareas.length === 0) {
    tablero.innerHTML = `
      <div class="empty-board">
        <i class="bi bi-inbox fs-3 d-block mb-2"></i>
        No hay tareas que mostrar.
      </div>`;
    return;
  }

  const usuario = usuarioActual();
  const notasCargadas = await Promise.all(listaTareas.map(tarea => cargarNotasTarea(tarea.id)));
  const tareasConNotas = listaTareas.map((tarea, index) => ({
    tarea,
    notas: notasCargadas[index],
  }));

  tablero.innerHTML = ESTADOS_TAREA.map(estado => {
    const tareasEstado = tareasConNotas.filter(item => item.tarea.estado === estado.id);
    const tarjetas = tareasEstado.length
      ? tareasEstado.map(item => renderizarTarjetaTarea(item.tarea, item.notas, usuario)).join('')
      : '<div class="kanban-empty">No hay tareas en este estado.</div>';

    return `
      <section class="kanban-column kanban-column--${estado.id}">
        <div class="kanban-column__header">
          <span>${estado.etiqueta}</span>
          <span class="badge rounded-pill bg-light text-dark">${tareasEstado.length}</span>
        </div>
        <div class="kanban-column__body">${tarjetas}</div>
      </section>
    `;
  }).join('');
};

const cargarTareas = async (pagina = 1) => {
  try {
    mostrarLoader(true);
    const estado = $('filtro-estado')?.value || '';
    const prioridad = $('filtro-prioridad')?.value || '';

    let params = `page=${pagina}&limit=${LIMITE}`;
    if (estado) params += `&estado=${estado}`;
    if (prioridad) params += `&prioridad=${prioridad}`;

    const respuesta = await tareas.listar(params);
    tareasCache = respuesta.datos.tareas;
    paginaActual = pagina;

    await renderizarTablero(tareasCache);
    renderizarPaginacion(respuesta.datos.paginacion);
  } catch (error) {
    mostrarAlerta('Error al cargar las tareas.', 'danger');
  } finally {
    mostrarLoader(false);
  }
};

const renderizarPaginacion = ({ pagina, totalPaginas } = {}) => {
  const nav = $('paginacion');
  if (!nav || !totalPaginas || totalPaginas <= 1) {
    if (nav) nav.innerHTML = '';
    return;
  }

  let html = '';
  for (let i = 1; i <= totalPaginas; i++) {
    html += `<li class="page-item ${i === pagina ? 'active' : ''}">
      <button class="page-link" onclick="cargarTareas(${i})">${i}</button>
    </li>`;
  }
  nav.innerHTML = `<ul class="pagination pagination-sm justify-content-center mb-0">${html}</ul>`;
};

const cargarTareasExternas = async () => {
  const contenedor = $('tareas-externas');
  if (!contenedor) return;

  try {
    const posts = await tareasExternas();
    contenedor.innerHTML = posts.map(post => `
      <div class="col-md-6 col-lg-4 mb-3">
        <div class="card h-100">
          <div class="card-body">
            <h6 class="card-title text-capitalize">${escaparHtml(post.title.substring(0, 50))}...</h6>
            <p class="card-text text-muted small">${escaparHtml(post.body.substring(0, 80))}...</p>
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
  $('tarea-id').value = '';
  $('tarea-titulo').value = '';
  $('tarea-descripcion').value = '';
  $('tarea-estado').value = 'pendiente';
  $('tarea-prioridad').value = 'media';
  $('tarea-vencimiento').value = '';
  $('tarea-asignado').value = '';
};

const setControl = (id, disabled) => {
  const control = $(id);
  if (control) control.disabled = disabled;
};

const configurarOpcionesEstado = (tarea = null) => {
  const select = $('tarea-estado');
  if (!select) return;

  const usuario = usuarioActual();
  const estados = esAdmin(usuario)
    ? ESTADOS_TAREA
    : ESTADOS_TAREA.filter(estado => ['pendiente', 'en_progreso', 'revision'].includes(estado.id));

  const valorActual = tarea?.estado || select.value || 'pendiente';
  select.innerHTML = estados
    .map(estado => `<option value="${estado.id}">${estado.etiqueta}</option>`)
    .join('');
  select.value = estados.some(estado => estado.id === valorActual) ? valorActual : 'revision';
};

const aplicarPermisosFormulario = (tarea = null) => {
  const usuario = usuarioActual();
  const admin = esAdmin(usuario);
  const creando = !tarea;
  const puedeGuardar = creando ? puedeCrearTarea(usuario) : puedeAbrirEditorTarea(tarea, usuario);

  configurarOpcionesEstado(tarea);
  setControl('tarea-titulo', !admin);
  setControl('tarea-descripcion', !admin);
  setControl('tarea-prioridad', !admin);
  setControl('tarea-vencimiento', !admin);
  setControl('tarea-asignado', !puedeAsignarTarea(usuario));
  setControl('tarea-estado', creando || !puedeCambiarEstadoTarea(tarea || {}, usuario));

  const grupoAsignado = $('tarea-asignado')?.closest('.col-md-6');
  if (grupoAsignado) grupoAsignado.style.display = admin ? '' : 'none';

  const btnGuardar = $('btn-guardar-tarea');
  if (btnGuardar) btnGuardar.style.display = puedeGuardar ? 'inline-block' : 'none';
};

const cargarUsuariosEnSelect = async () => {
  const select = $('tarea-asignado');
  if (!select) return;

  select.innerHTML = '<option value="">Selecciona usuario</option>';
  if (!puedeAsignarTarea()) return;

  try {
    const resp = await usuarios.listar();
    const usuariosAsignables = resp.datos.usuarios;

    if (!usuariosAsignables.length) {
      select.innerHTML = '<option value="">No hay usuarios registrados</option>';
      return;
    }

    select.innerHTML += usuariosAsignables
      .map(usuario => `<option value="${usuario.id}">${escaparHtml(usuario.nombre)}</option>`)
      .join('');
  } catch {
    select.innerHTML = '<option value="">No se pudieron cargar usuarios</option>';
  }
};

const abrirModalCrear = async () => {
  if (!puedeCrearTarea()) {
    mostrarAlerta('Solo un administrador puede crear tareas.', 'warning');
    return;
  }

  await cargarUsuariosEnSelect();
  resetearFormularioTarea();
  aplicarPermisosFormulario();
  $('modal-titulo').textContent = 'Nueva Tarea';
  new bootstrap.Modal($('modal-tarea')).show();
};

const abrirModalEditar = async (id) => {
  const tareaCache = obtenerTareaCache(id);
  if (tareaCache && !puedeAbrirEditorTarea(tareaCache)) {
    mostrarAlerta('No tienes permiso para editar esta tarea.', 'warning');
    return;
  }

  try {
    mostrarLoader(true);
    await cargarUsuariosEnSelect();

    const resp = await tareas.obtener(id);
    const tarea = resp.datos.tarea;

    $('modal-titulo').textContent = 'Editar Tarea';
    $('tarea-id').value = tarea.id;
    $('tarea-titulo').value = tarea.titulo;
    $('tarea-descripcion').value = tarea.descripcion || '';
    $('tarea-estado').value = tarea.estado;
    $('tarea-prioridad').value = tarea.prioridad;
    $('tarea-vencimiento').value = tarea.fecha_vencimiento || '';
    $('tarea-asignado').value = tarea.asignado_id || '';

    aplicarPermisosFormulario(tarea);
    new bootstrap.Modal($('modal-tarea')).show();
  } catch (error) {
    mostrarAlerta(error.mensaje || 'Error al cargar la tarea.', 'danger');
  } finally {
    mostrarLoader(false);
  }
};

const datosTareaDesdeFormulario = () => ({
  titulo: $('tarea-titulo').value.trim(),
  descripcion: $('tarea-descripcion').value.trim(),
  estado: $('tarea-estado').value,
  prioridad: $('tarea-prioridad').value,
  fecha_vencimiento: $('tarea-vencimiento').value || null,
  asignado_id: $('tarea-asignado').value || null,
});

const guardarTarea = async () => {
  const usuario = usuarioActual();
  const id = $('tarea-id').value;
  const datos = esAdmin(usuario)
    ? datosTareaDesdeFormulario()
    : { estado: $('tarea-estado').value };

  if (!id && !puedeCrearTarea(usuario)) {
    mostrarAlerta('Solo un administrador puede crear tareas.', 'warning');
    return;
  }

  if (esAdmin(usuario) && (!datos.titulo || datos.titulo.length < 3)) {
    mostrarAlerta('El titulo debe tener al menos 3 caracteres.', 'warning');
    return;
  }

  if (esAdmin(usuario) && !datos.asignado_id) {
    mostrarAlerta('Debes asignar la tarea a un usuario.', 'warning');
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

    bootstrap.Modal.getInstance($('modal-tarea')).hide();
    await Promise.all([cargarTareas(paginaActual), cargarEstadisticas()]);
  } catch (error) {
    mostrarAlerta(error.mensaje || 'Error al guardar la tarea.', 'danger');
  } finally {
    mostrarLoader(false);
  }
};

const confirmarEliminar = async (id) => {
  if (!puedeEliminarTarea()) {
    mostrarAlerta('Solo un administrador puede eliminar tareas.', 'warning');
    return;
  }
  if (!confirm('Estas seguro de que deseas eliminar esta tarea?')) return;

  try {
    mostrarLoader(true);
    await tareas.eliminar(id);
    mostrarAlerta('Tarea eliminada correctamente.', 'success');
    await Promise.all([cargarTareas(paginaActual), cargarEstadisticas()]);
  } catch (error) {
    mostrarAlerta(error.mensaje || 'Error al eliminar la tarea.', 'danger');
  } finally {
    mostrarLoader(false);
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  actualizarNavbar();

  const btnCrear = $('btn-crear-tarea');
  if (btnCrear) {
    btnCrear.style.display = puedeCrearTarea() ? 'inline-block' : 'none';
    btnCrear.addEventListener('click', abrirModalCrear);
  }

  const btnGuardar = $('btn-guardar-tarea');
  if (btnGuardar) btnGuardar.addEventListener('click', guardarTarea);

  ['filtro-estado', 'filtro-prioridad'].forEach(id => {
    const control = $(id);
    if (control) control.addEventListener('change', () => cargarTareas(1));
  });

  window.addEventListener('notas:actualizadas', () => cargarTareas(paginaActual));

  await Promise.all([
    cargarEstadisticas(),
    cargarTareas(),
    cargarTareasExternas(),
  ]);
});
