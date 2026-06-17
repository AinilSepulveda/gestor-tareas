const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tarea = sequelize.define('Tarea', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El título no puede estar vacío.' },
      len: { args: [3, 200], msg: 'El título debe tener entre 3 y 200 caracteres.' },
    },
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'en_progreso', 'completada', 'cancelada'),
    defaultValue: 'pendiente',
    allowNull: false,
  },
  prioridad: {
    type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'),
    defaultValue: 'media',
    allowNull: false,
  },
  fecha_vencimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: { msg: 'La fecha de vencimiento no es válida.' },
    },
  },
  // Clave foránea hacia el creador
  creador_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Clave foránea hacia el asignado (puede ser null)
  asignado_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'tareas',
  timestamps: true,
});

module.exports = Tarea;
