/**
 * slots.js
 * Define la colección MongoDB de slots (franjas horarias disponibles) del sistema BarberTurn.
 * Un slot representa una hora específica en la que un barbero puede atender a un cliente.
 * Los slots son creados por los barberos y reservados por los clientes.
 *
 * Estructura de un documento de la colección:
 * {
 *   _id: String,            // ID único generado por Mongo
 *   barberId: String,       // userId del barbero que crea el slot
 *   date: Date,             // Fecha del slot (normalizada a UTC medianoche)
 *   hour: String,           // Hora en formato 'HH:MM' (ej: '09:00')
 *   isAvailable: Boolean,   // true = libre, false = ocupado por un appointment
 *   appointmentId: String,  // ID del appointment asociado (null si está libre)
 *   createdAt: Date,        // Timestamp de creación
 * }
 */
import {Mongo} from 'meteor/mongo';

// Se crea y exporta la colección 'slots' para uso en server y cliente
export const Slots = new Mongo.Collection('slots');
