const Usuario = require('./Usuario');
const Tarea = require('./Tarea');
const Nota = require('./Nota');

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

// Una tarea puede tener muchas notas
Tarea.hasMany(Nota, {
  foreignKey: 'tarea_id',
  as: 'notas',
  onDelete: 'CASCADE',
});
Nota.belongsTo(Tarea, {
  foreignKey: 'tarea_id',
  as: 'tarea',
});

// Un usuario puede escribir muchas notas
Usuario.hasMany(Nota, {
  foreignKey: 'usuario_id',
  as: 'notas',
  onDelete: 'CASCADE',
});
Nota.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'autor',
});

module.exports = { Usuario, Tarea, Nota };
