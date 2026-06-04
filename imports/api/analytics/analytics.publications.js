/**
 * analytics.publications.js
 * Define la publicación Meteor para el módulo de analytics de BarberTurn.
 * A diferencia de otras publicaciones, esta combina dos colecciones en una sola
 * suscripción para que el cliente tenga todos los datos necesarios para los cálculos
 * de ocupación, demanda y estadísticas globales.
 *
 * Publicaciones disponibles:
 *  - analytics.overview → Combinación de Appointments y Slots con campos mínimos
 */
import { Meteor } from 'meteor/meteor';
import { Appointments } from '/imports/api/appointments/appointments';
import { Slots } from '/imports/api/slots/slots';

/**
 * analytics.overview
 * Publica un subconjunto de campos de Appointments y Slots para analytics.
 * Retorna un array de cursores, que Meteor DDP combina en una sola suscripción.
 *
 * Los campos publicados son mínimos para reducir el tráfico de red:
 *  - De Appointments: barberId, date, hour, status (para agrupar por día/hora/barbero/estado)
 *  - De Slots: barberId, date, hour, isAvailable (para calcular ocupación total)
 *
 * El cálculo completo de métricas se realiza en el cliente (hook useAnalytics)
 * para aprovechar la reactividad de MiniMongo sin sobrecargar el servidor.
 *
 * - Requiere usuario autenticado (cualquier rol: barbero o cliente)
 * - Usada exclusivamente por el hook useAnalytics y la página AnalyticsPage
 *
 * @returns {Array<Cursor>} Array con dos cursores: [Appointments, Slots]
 */
Meteor.publish('analytics.overview', function() {
  // Sin autenticación no se exponen datos estadísticos del sistema
  if (!this.userId) return this.ready();

  // Retornar un array de cursores: Meteor los une en una sola suscripción DDP
  return [
    // Solo los campos necesarios para los cálculos de analytics
    Appointments.find({}, { fields: { barberId: 1, date: 1, hour: 1, status: 1 } }),
    // Solo los campos necesarios para calcular la ocupación por slot
    Slots.find({}, { fields: { barberId: 1, date: 1, hour: 1, isAvailable: 1 } }),
  ];
});
