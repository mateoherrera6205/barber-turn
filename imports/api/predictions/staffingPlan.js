import { Mongo } from 'meteor/mongo';

export const StaffingPlan = new Mongo.Collection('staffing_plan');
// {
//   _id: String,
//   diaSemana: Number,   // 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
//   hora: String,        // '09:00' — franja afectada (destino en reasignar)
//   tipo: String,        // 'agregar' | 'reasignar' | 'reducir' | 'confirmar'
//   mensaje: String,     // descripción legible de la acción recomendada
//   prioridad: Number,   // 1 = urgente (personal), 2 = gestión preventiva
//   updatedAt: Date,
// }
