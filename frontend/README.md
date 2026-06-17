# Frontend - Gestor de Tareas Colaborativo

Frontend vanilla JavaScript para una app de gestion de tareas colaborativa. Consume una API REST en `http://localhost:3000/api` y muestra un tablero Kanban con tareas, estados, permisos por rol y notas separadas por tarea.

## Tecnologias

- HTML5
- CSS3
- JavaScript vanilla
- Bootstrap 5
- Bootstrap Icons
- Fetch API
- LocalStorage para token JWT y datos de sesion

## Requisitos

- Backend corriendo en `http://localhost:3000`
- Live Server o servidor estatico similar en `http://localhost:5500`
- Navegador moderno

## Ejecucion

1. Levantar el backend:

```bash
cd ../backend
npm install
npm run dev
```

2. Abrir el frontend con Live Server desde esta carpeta:

```text
http://localhost:5500/index.html
```

Importante: usar `localhost`, no `127.0.0.1`, para coincidir con la configuracion CORS del backend.

## Estructura

```text
frontend/
  index.html
  favicon.svg
  README.md
  diagrama-flujo.md
  css/
    estilos.css
  js/
    api.js
    auth.js
    dashboard.js
    notas.js
    origen.js
    permisos.js
    ui.js
  pages/
    admin.html
    login.html
    registro.html
```

## Archivos principales

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Dashboard publico, tablero de tareas, modal de tarea y reglas visibles. |
| `css/estilos.css` | Estilos del dashboard, tablero Kanban, tarjetas, notas y reglas. |
| `js/api.js` | Wrapper de `fetch` y servicios para auth, tareas, usuarios y notas. |
| `js/auth.js` | Sesion, JWT, login, registro, clases `Usuario` y `Administrador`. |
| `js/permisos.js` | Reglas de permisos del frontend por rol y estado. |
| `js/notas.js` | Carga, renderizado, creacion, edicion y eliminacion de notas. |
| `js/dashboard.js` | Orquestacion del tablero, filtros, estadisticas, modal y acciones de tarea. |
| `js/ui.js` | Utilidades visuales compartidas: alertas, loader, badges y fechas. |
| `js/origen.js` | Redirige `127.0.0.1` a `localhost` para evitar errores CORS. |

## Roles y permisos en UI

### Administrador

- Puede crear tareas.
- Puede asignar tareas a usuarios registrados.
- Puede editar titulo, descripcion, prioridad, fecha de vencimiento, asignacion y estado.
- Puede mover una tarea a `completada` o devolverla a otro estado.
- Puede eliminar tareas.
- Puede crear, editar y eliminar cualquier nota.

### Usuario

- Puede ver tareas y notas publicas.
- Puede cambiar estado solo si la tarea esta asignada a el.
- No puede marcar una tarea como `completada`.
- Su cierre de ciclo es mover la tarea a `revision`.
- Puede crear notas en tareas asignadas a el.
- Puede editar o eliminar sus propias notas.

## Estados de tarea

```text
pendiente
en_progreso
revision
completada
cancelada
```

Flujo esperado:

1. El admin crea y asigna una tarea.
2. El usuario asignado trabaja la tarea.
3. El usuario mueve la tarea a `revision`.
4. El admin revisa.
5. El admin marca como `completada` o devuelve a otro estado.

## Notas

Las notas no se guardan dentro de una tarea. Se gestionan con endpoints propios:

```http
GET    /api/notas/tarea/:tareaId
GET    /api/notas/:id
POST   /api/notas/tarea/:tareaId
PUT    /api/notas/:id
DELETE /api/notas/:id
```

En el tablero, las notas aparecen colapsadas por defecto con el boton `Ver notas (n)`. Esto mantiene limpia la vista de tareas pendientes.

## Endpoints usados por el frontend

### Auth

```http
POST /api/auth/registro
POST /api/auth/login
GET  /api/auth/perfil
```

### Tareas

```http
GET    /api/tareas
GET    /api/tareas/:id
POST   /api/tareas
PUT    /api/tareas/:id
DELETE /api/tareas/:id
```

### Usuarios

```http
GET /api/usuarios
```

Este endpoint se usa para llenar el selector `Asignar a` y requiere sesion de administrador.

### Notas

```http
GET    /api/notas/tarea/:tareaId
POST   /api/notas/tarea/:tareaId
PUT    /api/notas/:id
DELETE /api/notas/:id
```

## Manejo de sesion

- El token JWT se guarda en `localStorage`.
- `auth.js` valida si el token existe y si sigue vigente.
- Si el token expiro o es invalido, se limpia la sesion.
- `api.js` tambien limpia sesion si el backend responde `401`.

## Problemas comunes

### CORS por usar 127.0.0.1

Usar:

```text
http://localhost:5500/index.html
```

Evitar:

```text
http://127.0.0.1:5500/index.html
```

### Log de Immersive Web Emulator

Si aparece:

```text
[Immersive Web Emulator] native WebXR API successfully overridden
```

No pertenece a la app. Lo genera una extension del navegador.

## Validacion rapida

```bash
node --check js/api.js
node --check js/auth.js
node --check js/ui.js
node --check js/permisos.js
node --check js/notas.js
node --check js/dashboard.js
```

## Diagrama

Ver [diagrama-flujo.md](diagrama-flujo.md).
