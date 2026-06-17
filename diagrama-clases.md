# Diagrama de Clases — Gestor de Tareas Colaborativo
## Módulo 4: Programación Avanzada en JavaScript

```
┌─────────────────────────────────────┐
│             <<abstract>>            │
│              Usuario                │
├─────────────────────────────────────┤
│ + id: number                        │
│ + nombre: string                    │
│ + email: string                     │
│ # password: string (privado)        │
│ + rol: "usuario" | "administrador"  │
│ + activo: boolean                   │
├─────────────────────────────────────┤
│ + esAdministrador(): boolean        │
│ + obtenerIniciales(): string        │
│ + compararPassword(p): Promise<bool>│
└──────────────────┬──────────────────┘
                   │ <<hereda>>
                   │
       ┌───────────▼──────────────┐
       │      Administrador       │
       ├──────────────────────────┤
       │ + permisos: string[]     │
       ├──────────────────────────┤
       │ + tienePermiso(p): bool  │
       └──────────────────────────┘

┌─────────────────────────────────────┐
│               Tarea                 │
├─────────────────────────────────────┤
│ + id: number                        │
│ + titulo: string                    │
│ + descripcion: string | null        │
│ + estado: EstadoTarea               │
│ + prioridad: PrioridadTarea         │
│ + fecha_vencimiento: Date | null    │
│ + creador_id: number  ──────────────┼──> Usuario (creador)
│ + asignado_id: number | null ───────┼──> Usuario (asignado)
└─────────────────────────────────────┘

┌──────────────────────┐
│   <<enumeration>>    │
│     EstadoTarea      │
├──────────────────────┤
│ PENDIENTE            │
│ EN_PROGRESO          │
│ COMPLETADA           │
│ CANCELADA            │
└──────────────────────┘

┌──────────────────────┐
│   <<enumeration>>    │
│   PrioridadTarea     │
├──────────────────────┤
│ BAJA                 │
│ MEDIA                │
│ ALTA                 │
│ URGENTE              │
└──────────────────────┘

── Relaciones ──────────────────────────────────────────────
Usuario "1" ──< "0..*" Tarea  (tareasCreadas,  ON DELETE CASCADE)
Usuario "1" ──< "0..*" Tarea  (tareasAsignadas, ON DELETE SET NULL)
```
