/**
 * appointments.publications.js
 * Define las publicaciones Meteor para la colección de turnos.
 * Las publicaciones controlan qué documentos se sincronizan del servidor
 * al MiniMongo del cliente mediante el protocolo DDP de Meteor.
 *
 * Publicaciones disponibles:
 *  - appointments.myBarber → Todos los turnos activos del barbero logueado
 *  - appointments.today    → Turnos del barbero logueado para el día actual
 *  - appointments.all      → Todos los turnos sin filtro de barbero (para analytics)
 */
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Appointments } from './appointments';

/**
 * appointments.myBarber
 * Publica todos los turnos no cancelados del barbero actualmente logueado,
 * ordenados cronológicamente por fecha y hora.
 *
 * - Solo envía datos si hay un usuario autenticado (this.userId)
 * - Excluye los turnos cancelados para no mostrar historial negativo en el dashboard
 * - Se suscribe en el hook useAppointments o directamente con Meteor.subscribe()
 *
 * @returns {Cursor} Cursor de Appointments filtrado por barberId del usuario actual
 */
Meteor.publish('appointments.myBarber', function() {
  // Si no hay sesión activa, terminar la publicación sin enviar datos
  if (!this.userId) return this.ready();
  return Appointments.find({
    barberId: this.userId,          // Solo los turnos de este barbero
    status: { $ne: 'cancelled' }    // Excluir cancelados del listado activo
  }, {
    sort: { date: 1, hour: 1 }      // Ordenar de más antiguo a más reciente
  });
});

/**
 * appointments.today
 * Publica los turnos del barbero logueado correspondientes al día actual.
 * Usa un rango UTC para cubrir todas las horas del día sin importar la zona horaria.
 *
 * Nota: setUTCHours(28, 59, 59, 999) equivale a las 04:59:59.999 del día siguiente,
 * cubriendo así todo el horario laboral en UTC-5 (Ecuador).
 *
 * - Usada en DashboardPage a través del hook useAppointments
 *
 * @returns {Cursor} Cursor de Appointments del día actual para el barbero
 */
Meteor.publish('appointments.today', function() {
  // Proteger la publicación: sin sesión no se retornan datos
  if (!this.userId) return this.ready();

  // Calcular el inicio del día actual a las 05:00 UTC (medianoche Ecuador UTC-5)
  const start = new Date();
  start.setUTCHours(5, 0, 0, 0);

  // Calcular el fin del día: 28 horas UTC = 04:59 UTC del día siguiente,
  // lo que cubre hasta las 23:59 en UTC-5
  const end = new Date();
  end.setUTCHours(28, 59, 59, 999);

  return Appointments.find({
    barberId: this.userId,
    date: { $gte: start, $lte: end }  // Rango completo del día laboral
  });
});

/**
 * appointments.all
 * Publica todos los turnos del sistema sin filtro de barbero.
 * Diseñada para alimentar la página de Analytics con datos históricos completos.
 *
 * - Requiere usuario autenticado (cualquier rol)
 * - Ordena por fecha descendente para mostrar los más recientes primero
 * - Usada en el hook useAnalytics
 *
 * @returns {Cursor} Cursor de todos los Appointments ordenados por fecha desc
 */
Meteor.publish('appointments.all', function() {
  // Sin autenticación no se exponen datos de otros usuarios
  if (!this.userId) return this.ready();
  return Appointments.find({}, { sort: { date: -1 } });
});
