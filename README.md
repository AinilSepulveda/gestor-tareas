# Gestor de Tareas Colaborativo

**Evaluación Final — Módulo 9**  
**KIBERNUM IT Academy**

Sistema completo de gestión de tareas colaborativo construido con Node.js, Express, PostgreSQL, Sequelize ORM y frontend vanilla JS con Bootstrap.

---

## Arquitectura del Proyecto

```
gestor-tareas/
├── backend/                  # API REST (Node.js + Express)
│   ├── config/
│   │   └── database.js       # Conexión Sequelize → PostgreSQL
│   ├── controllers/
│   │   ├── authController.js   # Registro, login, perfil
│   │   ├── tareasController.js # CRUD de tareas
│   │   └── usuariosController.js
│   ├── middlewares/
│   │   ├── autenticacion.js  # JWT: autenticar, soloAdmin
│   │   └── validaciones.js   # Validación de entrada
│   ├── models/
│   │   ├── Usuario.js        # Modelo Sequelize con hooks bcrypt
│   │   ├── Tarea.js          # Modelo Sequelize
│   │   └── index.js          # Asociaciones One-to-Many
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── tareasRoutes.js
│   │   └── usuariosRoutes.js
│   ├── database.sql          # DDL + DML (Módulo 5)
│   ├── server.js             # Punto de entrada
│   ├── .env.example
│   └── package.json
└── frontend/                 # SPA Vanilla JS + Bootstrap
    ├── css/estilos.css
    ├── js/
    │   ├── api.js            # Wrapper fetch → API REST
    │   ├── auth.js           # Clases OOP, sesión, validaciones
    │   ├── ui.js             # Utilidades de interfaz
    │   └── dashboard.js      # Lógica del dashboard
    ├── index.html            # Dashboard (público)
    └── pages/
        ├── login.html
        ├── registro.html
        └── admin.html        # Solo administradores
```

---

## Requisitos previos

- Node.js v18+
- PostgreSQL v14+
- npm

---

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/gestor-tareas.git
cd gestor-tareas
```

### 2. Configurar la base de datos

```bash
# En PostgreSQL crear la base de datos
psql -U postgres -f backend/database.sql
```

O manualmente:
```sql
CREATE DATABASE gestor_tareas;
```

### 3. Configurar variables de entorno

```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL
```

### 4. Instalar dependencias y levantar el servidor

```bash
cd backend
npm install
npm run dev       # desarrollo con nodemon
# o
npm start         # producción
```

El servidor estará en `http://localhost:3000`.

### 5. Abrir el frontend

Abrir `frontend/index.html` con Live Server (VS Code) o similar en `http://localhost:5500`.

---

## Endpoints de la API

### Autenticación (público)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/registro` | Registrar nuevo usuario |
| POST | `/api/auth/login` | Iniciar sesión → retorna JWT |
| GET  | `/api/auth/perfil` | Perfil del usuario autenticado 🔒 |

### Tareas

| Método | Ruta | Acceso |
|--------|------|--------|
| GET  | `/api/tareas` | Público — dashboard |
| GET  | `/api/tareas/:id` | Público |
| GET  | `/api/tareas/usuario/mis-tareas` | Autenticado 🔒 |
| POST | `/api/tareas` | Autenticado 🔒 |
| PUT  | `/api/tareas/:id` | Autenticado 🔒 (creador o admin) |
| DELETE | `/api/tareas/:id` | Autenticado 🔒 (creador o admin) |

### Usuarios

| Método | Ruta | Acceso |
|--------|------|--------|
| GET  | `/api/usuarios` | Solo admin 🔒👑 |
| GET  | `/api/usuarios/:id` | Autenticado 🔒 |
| PUT  | `/api/usuarios/:id` | Autenticado 🔒 |
| DELETE | `/api/usuarios/:id` | Solo admin 🔒👑 |

---

## Seguridad — JWT

El token se obtiene al hacer login y debe enviarse en cada petición protegida:

```http
Authorization: Bearer <token>
```

El token expira en 24 horas (configurable en `.env`).

---

## Módulos cubiertos en este proyecto

| Módulo | Concepto | Implementación |
|--------|----------|---------------|
| M2 | HTML5 + CSS + Bootstrap responsivo | `frontend/` completo |
| M2 | Formularios con validación JS | `login.html`, `registro.html` |
| M3 | Lógica con funciones y persistencia | `auth.js`, `dashboard.js` |
| M4 | Clases OOP + herencia + fetch API | `Usuario`, `Administrador`, `tareasExternas()` |
| M5 | PostgreSQL DDL + DML | `database.sql` |
| M6 | Express + middlewares + JSON | `server.js` |
| M7 | Sequelize ORM + asociaciones | `models/`, `config/database.js` |
| M8 | API REST + JWT + rutas protegidas | `routes/`, `middlewares/autenticacion.js` |

---

## Pruebas manuales (Módulo 3)

### Prueba 1: Validación de formulario de registro

```javascript
// Caso: email inválido
validarFormularioRegistro({ nombre: 'Ana', email: 'no-es-email', password: '123456', confirmarPassword: '123456' })
// Resultado esperado: ['El email ingresado no es válido.']

// Caso: contraseñas no coinciden
validarFormularioRegistro({ nombre: 'Ana', email: 'ana@test.cl', password: '123456', confirmarPassword: '654321' })
// Resultado esperado: ['Las contraseñas no coinciden.']

// Caso: registro válido
validarFormularioRegistro({ nombre: 'Ana', email: 'ana@test.cl', password: '123456', confirmarPassword: '123456' })
// Resultado esperado: [] (sin errores)
```

### Prueba 2: API de tareas (con servidor corriendo)

```bash
# Crear usuario de prueba
curl -X POST http://localhost:3000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","email":"test@test.cl","password":"123456"}'

# Login y obtener token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.cl","password":"123456"}'
```

### Prueba 3: Creación de tarea protegida

```bash
# Con el token obtenido en la prueba 2:
curl -X POST http://localhost:3000/api/tareas \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Mi primera tarea","prioridad":"alta"}'
```
