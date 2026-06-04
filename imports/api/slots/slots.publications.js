/**
 * slots.publications.js
 * Define las publicaciones Meteor para la colección de slots horarios.
 * Controlan qué slots se sincronizan al MiniMongo del cliente según el contexto.
 *
 * Publicaciones disponibles:
 *  - slots.available → Slots libres en una fecha dada (para clientes que reservan)
 *  - slots.myDay     → Todos los slots de un barbero en una fecha (para su dashboard)
 */
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Slots } from './slots';

/**
 * slots.available
 * Publica todos los slots disponibles (isAvailable: true) para una fecha concreta.
 * Usada en BookingPage para que los clientes vean los horarios libres.
 *
 * Usa un rango UTC completo del día para evitar problemas de comparación exacta
 * de fechas con milisegundos distintos (ya explicado en el comentario original del código).
 *
 * @param {Date} date - La fecha para la cual buscar slots disponibles
 * @returns {Cursor} Cursor de Slots disponibles en esa fecha (cualquier barbero)
 */
Meteor.publish('slots.available', function({ date }) {
  // Validar que el parámetro date sea un objeto Date
  check(date, Date);

  // Usar rango del día completo en vez de igualdad exacta
  // para evitar problemas de milisegundos en comparación de fechas
  // Inicio del día a las 00:00:00.000 UTC
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);

  // Fin del día a las 23:59:59.999 UTC
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);

  // Solo retornar slots disponibles en ese rango de fecha
  return Slots.find({
    date: { $gte: start, $lte: end },
    isAvailable: true,               // Solo los que no tienen reserva
  });
});

/**
 * slots.myDay
 * Publica todos los slots (disponibles u ocupados) de un barbero en una fecha.
 * Usada en el Dashboard del barbero para ver el panorama completo de su jornada.
 *
 * A diferencia de slots.available, esta publicación incluye todos los slots
 * sin importar si están ocupados, para que el barbero vea su agenda completa.
 *
 * @param {Date} date - La fecha de la jornada a consultar
 * @returns {Cursor} Cursor de todos los Slots del barbero en esa fecha
 */
Meteor.publish('slots.myDay', function({ date }) {
  // Validar el tipo del parámetro
  check(date, Date);

  // Sin sesión activa no se retornan datos
  if (!this.userId) return this.ready();

  // Rango completo del día en UTC para comparación consistente de fechas
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);

  // Retornar todos los slots del barbero logueado en ese día (libres y ocupados)
  return Slots.find({
    barberId: this.userId,
    date: { $gte: start, $lte: end },
  });
});
