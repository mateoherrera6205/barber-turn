import { Mongo } from 'meteor/mongo';
export const Predictions = new Mongo.Collection('predictions');
// {
//   _id: String,
//   diaSemana: Number,        // 1=lun, 2=mar... 6=sab
//   hora: String,             // '09:00'
//   clientesEsperados: Number, // promedio histórico
//   barberosRecomendados: Number,
//   ocupacionHistorica: Number, // % promedio
//   alerta: String,           // 'ok' | 'overbooking' | 'sobrecapacidad' | 'demanda_alta'
//   semanasTomadas: Number,   // cuántas semanas de datos se usaron
//   updatedAt: Date,
// }