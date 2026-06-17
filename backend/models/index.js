const Usuario = require('./Usuario');
const Tarea = require('./Tarea');

// Relaciones: Un usuario crea muchas tareas
Usuario.hasMany(Tarea, {
  foreignKey: 'creador_id',
  as: 'tareasCreadas',
  onDelete: 'CASCADE',
});
Tarea.belongsTo(Usuario, {
  foreignKey: 'creador_id',
  as: 'creador',
});

// Un usuario puede tener muchas tareas asignadas
Usuario.hasMany(Tarea, {
  foreignKey: 'asignado_id',
  as: 'tareasAsignadas',
  onDelete: 'SET NULL',
});
Tarea.belongsTo(Usuario, {
  foreignKey: 'asignado_id',
  as: 'asignado',
});

module.exports = { Usuario, Tarea };
