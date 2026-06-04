/**
 * appointments.js
 * Define la colección MongoDB de turnos (citas) del sistema BarberTurn.
 * Esta colección almacena cada turno reservado por un cliente con un barbero,
 * incluyendo el slot asociado, datos del cliente, estado y timestamps.
 *
 * Estructura de un documento de la colección:
 * {
 *   _id: String,            // ID único generado por Mongo
 *   slotId: String,         // Referencia al slot que ocupa este turno
 *   clientName: String,     // Nombre del cliente
 *   clientPhone: String,    // Teléfono de contacto del cliente
 *   barberId: String,       // userId del barbero asignado
 *   date: Date,             // Fecha del turno
 *   hour: String,           // Hora en formato 'HH:MM'
 *   status: String,         // 'pending' | 'confirmed' | 'cancelled'
 *   createdAt: Date,        // Timestamp de creación
 *   updatedAt: Date,        // Timestamp de última modificación (opcional)
 *   cancelledAt: Date,      // Timestamp de cancelación (opcional)
 * }
 */
import { Mongo } from 'meteor/mongo';

// Se crea y exporta la colección 'appointments' para que pueda ser importada
// tanto en el servidor (methods, publications) como en el cliente (MiniMongo)
export const Appointments = new Mongo.Collection('appointments');
