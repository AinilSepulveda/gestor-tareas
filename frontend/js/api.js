/**
 * api.js — Módulo de comunicación con la API REST
 * Centraliza todas las llamadas fetch al backend
 */

const API_URL = 'http://localhost:3000/api';

/**
 * Retorna los headers comunes para las peticiones
 */
const obtenerHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

/**
 * Wrapper genérico de fetch con manejo de errores
 */
const peticion = async (url, opciones = {}) => {
  const respuesta = await fetch(`${API_URL}${url}`, {
    headers: obtenerHeaders(),
    ...opciones,
  });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw { status: respuesta.status, ...datos };
  return datos;
};

// ─── Auth ────────────────────────────────────────────────────────────────────
const auth = {
  registro: (datos) => peticion('/auth/registro', { method: 'POST', body: JSON.stringify(datos) }),
  login:    (datos) => peticion('/auth/login',    { method: 'POST', body: JSON.stringify(datos) }),
  perfil:   ()      => peticion('/auth/perfil'),
};

// ─── Tareas ──────────────────────────────────────────────────────────────────
const tareas = {
  listar:      (params = '') => peticion(`/tareas?${params}`),
  obtener:     (id)          => peticion(`/tareas/${id}`),
  misTareas:   ()            => peticion('/tareas/usuario/mis-tareas'),
  crear:       (datos)       => peticion('/tareas',     { method: 'POST', body: JSON.stringify(datos) }),
  actualizar:  (id, datos)   => peticion(`/tareas/${id}`, { method: 'PUT',  body: JSON.stringify(datos) }),
  eliminar:    (id)          => peticion(`/tareas/${id}`, { method: 'DELETE' }),
};

// ─── Usuarios ─────────────────────────────────────────────────────────────────
const usuarios = {
  listar:    ()         => peticion('/usuarios'),
  obtener:   (id)       => peticion(`/usuarios/${id}`),
  actualizar:(id, datos)=> peticion(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),
};

// ─── JSONPlaceholder (Módulo 4) ──────────────────────────────────────────────
const tareasExternas = async () => {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=10');
  return res.json();
};
