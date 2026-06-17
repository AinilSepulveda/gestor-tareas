const notasPorTarea = new Map();
const tareasConNotasVisibles = new Set();

const normalizarNotas = (respuesta) => {
  const datos = respuesta?.datos;
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.notas)) return datos.notas;
  if (datos?.nota) return [datos.nota];
  return [];
};

const cargarNotasTarea = async (tareaId) => {
  try {
    const respuesta = await notas.listarPorTarea(tareaId);
    const lista = normalizarNotas(respuesta);
    notasPorTarea.set(tareaId, lista);
    return lista;
  } catch {
    notasPorTarea.set(tareaId, []);
    return [];
  }
};

const buscarNotaPorId = (notaId) => {
  for (const lista of notasPorTarea.values()) {
    const nota = lista.find(item => item.id === notaId);
    if (nota) return nota;
  }
  return null;
};

const pedirRefrescoNotas = () => {
  window.dispatchEvent(new CustomEvent('notas:actualizadas'));
};

const toggleNotas = (tareaId) => {
  if (tareasConNotasVisibles.has(tareaId)) {
    tareasConNotasVisibles.delete(tareaId);
  } else {
    tareasConNotasVisibles.add(tareaId);
  }
  pedirRefrescoNotas();
};

const renderizarNotas = (tarea, listaNotas, usuario) => {
  const abiertas = tareasConNotasVisibles.has(tarea.id);
  const textoBoton = abiertas ? 'Ocultar notas' : `Ver notas (${listaNotas.length})`;

  if (!abiertas) {
    return `
      <div class="task-notes task-notes--collapsed">
        <button class="btn btn-sm btn-outline-secondary w-100" onclick="toggleNotas(${tarea.id})">
          <i class="bi bi-stickies me-1"></i>${textoBoton}
        </button>
      </div>
    `;
  }

  const notasHtml = listaNotas.length
    ? listaNotas.map(nota => {
        const acciones = puedeGestionarNota(nota, usuario) ? `
          <div class="nota-actions">
            <button class="btn btn-link btn-sm p-0" onclick="editarNota(${nota.id})">Editar</button>
            <button class="btn btn-link btn-sm p-0 text-danger" onclick="eliminarNota(${nota.id})">Eliminar</button>
          </div>
        ` : '';

        return `
          <div class="nota-item">
            <div class="nota-texto">${escaparHtml(nota.texto)}</div>
            <div class="nota-meta">
              <span>${escaparHtml(nota.autor?.nombre || 'Sin autor')}</span>
              ${acciones}
            </div>
          </div>
        `;
      }).join('')
    : '<div class="nota-empty">Sin notas.</div>';

  const formularioNota = puedeCrearNota(tarea, usuario) ? `
    <div class="nota-form">
      <textarea class="form-control form-control-sm" id="nota-nueva-${tarea.id}" rows="2" placeholder="Agregar nota..."></textarea>
      <button class="btn btn-sm btn-outline-primary" onclick="crearNota(${tarea.id})">
        <i class="bi bi-chat-left-text me-1"></i>Guardar nota
      </button>
    </div>
  ` : '';

  return `
    <div class="task-notes">
      <div class="task-notes__title">
        <span><i class="bi bi-stickies me-1"></i>Notas</span>
        <button class="btn btn-link btn-sm p-0" onclick="toggleNotas(${tarea.id})">${textoBoton}</button>
      </div>
      ${notasHtml}
      ${formularioNota}
    </div>
  `;
};

const crearNota = async (tareaId) => {
  const textarea = document.getElementById(`nota-nueva-${tareaId}`);
  const texto = textarea?.value.trim();
  if (!texto) {
    mostrarAlerta('La nota no puede estar vacia.', 'warning');
    return;
  }

  try {
    mostrarLoader(true);
    await notas.crear(tareaId, { texto });
    mostrarAlerta('Nota creada correctamente.', 'success');
    pedirRefrescoNotas();
  } catch (error) {
    mostrarAlerta(error.mensaje || 'Error al crear la nota.', 'danger');
  } finally {
    mostrarLoader(false);
  }
};

const editarNota = async (notaId) => {
  const nota = buscarNotaPorId(notaId);
  if (!nota) return;

  const texto = prompt('Editar nota', nota.texto || '');
  if (texto === null) return;
  const textoLimpio = texto.trim();
  if (!textoLimpio) {
    mostrarAlerta('La nota no puede quedar vacia.', 'warning');
    return;
  }

  try {
    mostrarLoader(true);
    await notas.actualizar(notaId, { texto: textoLimpio });
    mostrarAlerta('Nota actualizada correctamente.', 'success');
    pedirRefrescoNotas();
  } catch (error) {
    mostrarAlerta(error.mensaje || 'Error al actualizar la nota.', 'danger');
  } finally {
    mostrarLoader(false);
  }
};

const eliminarNota = async (notaId) => {
  if (!confirm('Eliminar esta nota?')) return;

  try {
    mostrarLoader(true);
    await notas.eliminar(notaId);
    mostrarAlerta('Nota eliminada correctamente.', 'success');
    pedirRefrescoNotas();
  } catch (error) {
    mostrarAlerta(error.mensaje || 'Error al eliminar la nota.', 'danger');
  } finally {
    mostrarLoader(false);
  }
};
