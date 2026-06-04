/**
 * useAppointments.js
 * Hook personalizado de React para acceder a los turnos del día actual del barbero.
 * Se suscribe a la publicación 'appointments.today' que filtra los turnos
 * del barbero logueado para la jornada actual.
 *
 * Suscripción utilizada: 'appointments.today'
 *  - Requiere usuario autenticado con rol barbero
 *  - Retorna turnos del día actual del barbero (filtrados por fecha en UTC-5)
 *
 * @returns {Object} Objeto con:
 *   - isLoading    {Boolean}       true mientras la suscripción no ha terminado de cargar
 *   - appointments {Array<Object>} Lista de turnos del día ordenados por hora ascendente
 */
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Appointments } from '/imports/api/appointments/appointments';

export function useAppointments() {
  // useTracker sin dependencias: se re-ejecuta cada vez que cambian los datos en MiniMongo
  return useTracker(() => {
    // Suscribirse a la publicación que filtra los turnos del barbero para hoy
    const handle = Meteor.subscribe('appointments.today');

    return {
      // handle.ready() es false mientras la BD todavía está enviando documentos al cliente
      isLoading: !handle.ready(),
      // Consultar el MiniMongo local con todos los documentos sincronizados,
      // ordenados por hora para mostrarlos cronológicamente en el dashboard
      appointments: Appointments.find(
        {},
        { sort: { hour: 1 } }  // Orden ascendente por hora ('09:00' antes que '17:00')
      ).fetch(),
    };
  });
}
