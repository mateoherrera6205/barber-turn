/**
 * useSlots.js
 * Hook personalizado de React para obtener los slots disponibles en una fecha concreta.
 * Se suscribe a la publicación 'slots.available' que retorna solo los slots libres
 * (isAvailable: true) para el día seleccionado.
 *
 * Suscripción utilizada: 'slots.available'
 *  - No requiere autenticación (clientes pueden ver slots sin estar logueados)
 *  - Parámetro: { date } → objeto Date de la fecha a consultar
 *  - Retorna todos los slots disponibles de cualquier barbero para esa fecha
 *
 * @param {Date} date - Fecha para la cual se quieren ver los slots disponibles
 *
 * @returns {Object} Objeto con:
 *   - isLoading {Boolean}       true mientras la suscripción está cargando
 *   - slots     {Array<Object>} Lista de slots disponibles en esa fecha
 */
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Slots } from '/imports/api/slots/slots';

export function useSlots(date) {
  // El segundo argumento [date] le indica a useTracker que debe re-ejecutarse
  // cuando cambie la fecha seleccionada, re-suscribiéndose con el nuevo parámetro
  return useTracker(() => {
    // Suscribirse con la fecha como parámetro para que el servidor filtre correctamente
    const handle = Meteor.subscribe('slots.available', { date });

    return {
      // Indicar estado de carga mientras llegan los documentos del servidor
      isLoading: !handle.ready(),
      // Consultar el MiniMongo local por los slots de esa fecha
      // (el servidor ya filtra por isAvailable, pero la consulta local es por fecha)
      slots: Slots.find({ date }).fetch(),
    };
  }, [date]);  // Dependencia: re-suscribir cuando cambie la fecha
}
