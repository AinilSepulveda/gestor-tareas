const usuarioActual = () => obtenerUsuarioActual();

const esAdmin = (usuario = usuarioActual()) => Boolean(usuario?.esAdministrador());

const esTareaAsignadaAUsuario = (tarea, usuario = usuarioActual()) => {
  if (!tarea || !usuario) return false;
  return tarea.asignado_id === usuario.id || tarea.asignado?.id === usuario.id;
};

const puedeCrearTarea = (usuario = usuarioActual()) => esAdmin(usuario);

const puedeEditarContenidoTarea = (usuario = usuarioActual()) => esAdmin(usuario);

const puedeAsignarTarea = (usuario = usuarioActual()) => esAdmin(usuario);

const puedeCambiarEstadoTarea = (tarea, usuario = usuarioActual()) => (
  esAdmin(usuario)
  || (
    esTareaAsignadaAUsuario(tarea, usuario)
    && !['revision', 'completada', 'cancelada'].includes(tarea.estado)
  )
);

const puedeAbrirEditorTarea = (tarea, usuario = usuarioActual()) => (
  puedeEditarContenidoTarea(usuario) || puedeCambiarEstadoTarea(tarea, usuario)
);

const puedeEliminarTarea = (usuario = usuarioActual()) => esAdmin(usuario);

const puedeCrearNota = (tarea, usuario = usuarioActual()) => (
  esAdmin(usuario) || esTareaAsignadaAUsuario(tarea, usuario)
);

const puedeGestionarNota = (nota, usuario = usuarioActual()) => {
  if (!nota || !usuario) return false;
  const autorId = nota.autor_id || nota.usuario_id || nota.autor?.id;
  return esAdmin(usuario) || autorId === usuario.id;
};
