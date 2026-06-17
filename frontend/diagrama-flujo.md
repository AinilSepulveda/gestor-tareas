# Diagrama de Flujo - Gestor de Tareas

Este archivo describe el flujo principal del frontend y el ciclo de vida de una tarea.

## Flujo general de uso

```mermaid
flowchart TD
  Inicio["Usuario abre index.html"] --> Origen{"Origen es 127.0.0.1?"}
  Origen -- "Si" --> Redirige["Redirigir a localhost"]
  Origen -- "No" --> Dashboard["Cargar dashboard"]
  Redirige --> Dashboard

  Dashboard --> TareasPublicas["GET /api/tareas"]
  Dashboard --> NotasPublicas["GET /api/notas/tarea/:tareaId"]
  TareasPublicas --> Tablero["Renderizar tablero Kanban"]
  NotasPublicas --> Tablero

  Dashboard --> Sesion{"Hay JWT vigente?"}
  Sesion -- "No" --> SoloLectura["Vista publica: tareas y notas"]
  Sesion -- "Si" --> Rol{"Rol del usuario"}

  Rol -- "Administrador" --> AdminAcciones["Crear, asignar, editar, revisar y eliminar tareas"]
  Rol -- "Usuario" --> UsuarioAcciones["Cambiar estado y crear notas solo en tareas asignadas"]

  AdminAcciones --> Usuarios["GET /api/usuarios para selector Asignar a"]
  AdminAcciones --> GuardarTarea["POST/PUT /api/tareas"]
  UsuarioAcciones --> CambiarEstado["PUT /api/tareas/:id con estado"]
  UsuarioAcciones --> CrearNota["POST /api/notas/tarea/:tareaId"]

  GuardarTarea --> Refrescar["Recargar tareas, estadisticas y notas"]
  CambiarEstado --> Refrescar
  CrearNota --> Refrescar
  Refrescar --> Tablero
```

## Ciclo de vida de una tarea

```mermaid
stateDiagram-v2
  [*] --> pendiente: Admin crea y asigna
  pendiente --> en_progreso: Usuario inicia trabajo
  en_progreso --> revision: Usuario termina su ciclo
  pendiente --> revision: Usuario envia a revision

  revision --> completada: Admin aprueba
  revision --> pendiente: Admin devuelve
  revision --> en_progreso: Admin solicita ajustes
  revision --> cancelada: Admin cancela

  pendiente --> cancelada: Admin cancela
  en_progreso --> cancelada: Admin cancela
  completada --> [*]
  cancelada --> [*]
```

## Permisos por rol

```mermaid
flowchart LR
  Admin["Administrador"] --> Crear["Crear tarea"]
  Admin --> Asignar["Asignar a usuario registrado"]
  Admin --> Editar["Editar contenido"]
  Admin --> EstadoAdmin["Cambiar cualquier estado"]
  Admin --> Eliminar["Eliminar tarea"]
  Admin --> NotaAdmin["Gestionar cualquier nota"]

  Usuario["Usuario asignado"] --> Ver["Ver tareas y notas"]
  Usuario --> EstadoUsuario["Cambiar estado hasta revision"]
  Usuario --> NotaPropia["Crear nota en tarea asignada"]
  Usuario --> GestionPropia["Editar/eliminar nota propia"]

  Usuario -. "No puede" .-> Completar["Marcar completada"]
  Usuario -. "No puede" .-> Asignar
  Usuario -. "No puede" .-> Eliminar
```

## Flujo de notas

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant API as API REST
  participant DB as PostgreSQL

  UI->>API: GET /api/notas/tarea/:tareaId
  API->>DB: Buscar notas de la tarea
  DB-->>API: Lista de notas con autor
  API-->>UI: datos.notas
  UI->>UI: Mostrar boton Ver notas (n)

  alt Usuario autorizado crea nota
    UI->>API: POST /api/notas/tarea/:tareaId
    API->>DB: Guardar nota con usuario_id
    DB-->>API: Nota creada
    API-->>UI: Exito
    UI->>API: GET /api/notas/tarea/:tareaId
  else Usuario sin permiso
    API-->>UI: 403 Forbidden
    UI->>UI: Mostrar alerta
  end
```

## Modulos frontend

```mermaid
flowchart TD
  HTML["index.html"] --> API["js/api.js"]
  HTML --> Auth["js/auth.js"]
  HTML --> UI["js/ui.js"]
  HTML --> Permisos["js/permisos.js"]
  HTML --> Notas["js/notas.js"]
  HTML --> Dashboard["js/dashboard.js"]

  Dashboard --> API
  Dashboard --> Permisos
  Dashboard --> Notas
  Dashboard --> UI
  Notas --> API
  Notas --> Permisos
  Auth --> UI
```
