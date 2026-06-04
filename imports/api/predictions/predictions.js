/**
 * predictions.js
 * Define la colección MongoDB de predicciones de demanda del sistema BarberTurn.
 * Esta colección almacena los resultados del algoritmo de predicción que analiza
 * el historial de appointments para estimar la demanda futura por día y hora.
 *
 * La colección se regenera completamente cada vez que se ejecuta calcularPredicciones()
 * (se hace removeAsync({}) seguido de inserts), por lo que representa siempre
 * el estado más reciente del cálculo.
 *
 * Estructura de un documento de la colección:
 * {
 *   _id: String,                    // ID único generado por Mongo
 *   diaSemana: Number,              // 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
 *   hora: String,                   // Franja horaria en formato 'HH:MM' (ej: '09:00')
 *   clientesEsperados: Number,      // Promedio de clientes confirmados por semana en esa franja
 *   barberosRecomendados: Number,   // Cantidad mínima de barberos sugerida para cubrir la demanda
 *   ocupacionHistorica: Number,     // Porcentaje de slots confirmados vs total (0 a 1)
 *   alerta: String,                 // 'ok' | 'overbooking' | 'sobrecapacidad' | 'demanda_alta'
 *   semanasTomadas: Number,         // Cantidad de semanas de histórico consideradas
 *   updatedAt: Date,                // Fecha del último recálculo
 * }
 */
import { Mongo } from 'meteor/mongo';

// Se crea y exporta la colección 'predictions' para uso en servidor y cliente
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
