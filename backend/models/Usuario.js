const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre no puede estar vacío.' },
      len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres.' },
    },
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: { msg: 'Este email ya está registrado.' },
    validate: {
      isEmail: { msg: 'El email no es válido.' },
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: { args: [6, 255], msg: 'La contraseña debe tener mínimo 6 caracteres.' },
    },
  },
  rol: {
    type: DataTypes.STRING(20),
    defaultValue: 'usuario',
    allowNull: false,
    validate: {
      isIn: {
        args: [['administrador', 'usuario']],
        msg: 'El rol debe ser administrador o usuario.',
      },
    },
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'usuarios',
  timestamps: true,
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.password) {
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(usuario.password, salt);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(usuario.password, salt);
      }
    },
  },
});

// Método de instancia para comparar contraseñas
Usuario.prototype.compararPassword = async function (passwordPlano) {
  return bcrypt.compare(passwordPlano, this.password);
};

// Método de instancia para retornar datos seguros (sin password)
Usuario.prototype.toJSON = function () {
  const valores = { ...this.get() };
  delete valores.password;
  return valores;
};

module.exports = Usuario;
