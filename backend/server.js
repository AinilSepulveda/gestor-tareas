require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { conectarDB, sequelize } = require('./config/database');
require('./models'); // Inicializa las asociaciones

const authRoutes = require('./routes/authRoutes');
const tareasRoutes = require('./routes/tareasRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares globales ────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Formatea las respuestas JSON con codigo HTTP y mensaje numerado.
app.use((req, res, next) => {
  const jsonOriginal = res.json.bind(res);

  res.json = (body) => {
    if (body && typeof body === 'object' && typeof body.exito === 'boolean') {
      const codigo = res.statusCode >= 100 ? res.statusCode : (body.exito ? 200 : 500);
      const tipoMensaje = body.exito ? 'Exito' : 'Error';
      const mensajePorDefecto = body.exito ? 'Solicitud procesada correctamente.' : 'Error inesperado.';
      const mensajeBase = body.mensaje || (Array.isArray(body.errores) ? body.errores.join(' ') : mensajePorDefecto);
      const prefijo = `${tipoMensaje} ${codigo}:`;

      return jsonOriginal({
        ...body,
        codigo,
        mensaje: mensajeBase.startsWith(prefijo)
          ? mensajeBase
          : `${prefijo} ${mensajeBase}`,
      });
    }

    return jsonOriginal(body);
  };

  next();
});

// ─── Rutas ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/tareas', tareasRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Ruta raíz informativa
app.get('/', (req, res) => {
  res.json({
    exito: true,
    mensaje: 'API Gestor de Tareas Colaborativo v1.0',
    endpoints: {
      auth: '/api/auth',
      tareas: '/api/tareas',
      usuarios: '/api/usuarios',
    },
  });
});

// ─── Middleware de ruta no encontrada ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ exito: false, mensaje: 'Ruta no encontrada.' });
});

// ─── Middleware de errores globales ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
});

// ─── Inicio del servidor ─────────────────────────────────────────────────────
const iniciarServidor = async () => {
  await conectarDB();
  await sequelize.sync({ alter: true });
  console.log('Modelos sincronizados con la base de datos.');

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Modo: ${process.env.NODE_ENV}`);
  });
};

iniciarServidor();
