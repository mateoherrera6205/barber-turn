/**
 * slots.methods.js
 * Define los métodos Meteor (RPC del servidor) para gestión de slots horarios.
 * Los slots son las franjas horarias que el barbero habilita para recibir clientes.
 *
 * Métodos disponibles:
 *  - slots.generateForDay → Genera los slots disponibles para un día específico
 */
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Slots } from './slots';

Meteor.methods({
  /**
   * slots.generateForDay
   * Genera o regenera los slots disponibles para un barbero en una fecha dada.
   * Primero elimina los slots libres existentes en esa fecha para ese barbero,
   * luego inserta los nuevos slots con las horas seleccionadas.
   *
   * @param {Date}     date  - Fecha para la que se generan los slots
   * @param {String[]} hours - Array de horas en formato 'HH:MM' (ej: ['09:00','10:00'])
   *
   * Lógica interna:
   *  1. Valida que date sea un Date y hours sea un array de Strings
   *  2. Verifica que el usuario esté autenticado (solo barberos generan slots)
   *  3. Elimina los slots disponibles existentes para esa fecha/barbero
   *     (solo los disponibles, para no eliminar slots ya reservados)
   *  4. Inserta un slot por cada hora en el array hours
   *
   * Nota: Al eliminar solo los que tienen isAvailable:true, se preservan los
   * slots ya ocupados (con appointments pendientes o confirmados).
   */
  async 'slots.generateForDay'({ date, hours }) {
    // Validar que date sea un objeto Date y hours un array de strings
    check(date, Date);
    check(hours, [String]);

    // Solo barberos autenticados pueden crear slots
    if (!this.userId) throw new Meteor.Error('not-logged-in', 'Debes iniciar sesión');

    // Eliminar slots disponibles previos para esta fecha y barbero
    // Se respetan los slots ya ocupados (isAvailable: false) para no perder reservas
    await Slots.removeAsync({
      barberId: this.userId,
      date,
      isAvailable: true,
    });

    // Insertar un slot por cada hora seleccionada por el barbero
    for (const hour of hours) {
      await Slots.insertAsync({
        barberId: this.userId,   // El barbero que crea el slot es el usuario actual
        date,
        hour,
        isAvailable: true,       // Inicialmente disponible para reserva
        appointmentId: null,     // Sin appointment asociado hasta que alguien reserve
        createdAt: new Date(),
      });
    }
  },
});
