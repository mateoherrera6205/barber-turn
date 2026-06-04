/**
 * appointments.methods.js
 * Define los métodos Meteor (RPC del servidor) relacionados con los turnos.
 * Estos métodos son invocados desde el cliente con Meteor.call() y se ejecutan
 * en el servidor con acceso completo a la base de datos.
 *
 * Métodos disponibles:
 *  - appointments.book          → Reservar un turno en un slot disponible
 *  - appointments.updateStatus  → Cambiar el estado de un turno (solo el barbero dueño)
 *  - appointments.cancel        → Cancelar un turno y liberar su slot
 */
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Appointments } from './appointments';
import { Slots } from '../slots/slots';
import { APPOINTMENT_STATUS } from '/imports/utils/constants';

Meteor.methods({
  /**
   * appointments.book
   * Reserva un turno para un cliente en un slot disponible.
   *
   * @param {String} slotId     - ID del slot que se desea reservar
   * @param {String} clientName - Nombre del cliente que reserva
   * @param {String} clientPhone - Teléfono del cliente
   *
   * Lógica interna:
   *  1. Valida los tipos de los parámetros con check()
   *  2. Busca el slot por ID y verifica que esté disponible (isAvailable: true)
   *  3. Si no existe o no está disponible, lanza un error
   *  4. Inserta un nuevo documento en Appointments con estado 'pending'
   *  5. Marca el slot como no disponible y le asocia el appointmentId
   *
   * @returns {String} El _id del appointment recién creado
   */
  async 'appointments.book'({ slotId, clientName, clientPhone }) {
    // Validación de tipos para prevenir datos malformados desde el cliente
    check(slotId, String);
    check(clientName, String);
    check(clientPhone, String);

    // Verificar que el slot exista y esté disponible antes de reservar
    // Se filtra también por isAvailable para evitar reservas duplicadas en condición de carrera
    const slot = await Slots.findOneAsync({ _id: slotId, isAvailable: true });
    if (!slot) throw new Meteor.Error('slot-unavailable', 'Este turno ya no está disponible');

    // Crear el turno con los datos del cliente y los del slot (barbero, fecha, hora)
    // El estado inicial es siempre 'pending' hasta que el barbero lo confirme
    const appointmentId = await Appointments.insertAsync({
      slotId,
      clientName,
      clientPhone,
      barberId: slot.barberId,   // Heredado del slot para saber a qué barbero pertenece
      date: slot.date,           // Heredado del slot
      hour: slot.hour,           // Heredado del slot
      status: 'pending',         // Estado inicial: esperando confirmación del barbero
      createdAt: new Date(),
    });

    // Marcar el slot como ocupado y referenciar el appointment creado
    // Esto evita que otro cliente pueda reservar el mismo slot
    await Slots.updateAsync(slotId, {
      $set: { isAvailable: false, appointmentId }
    });

    return appointmentId;
  },

  /**
   * appointments.updateStatus
   * Actualiza el estado de un turno. Solo puede hacerlo el barbero propietario del turno.
   *
   * @param {String} appointmentId - ID del turno a actualizar
   * @param {String} status        - Nuevo estado ('pending' | 'confirmed' | 'cancelled')
   *
   * Lógica interna:
   *  1. Valida tipos con check()
   *  2. Verifica que el estado sea uno de los valores válidos definidos en APPOINTMENT_STATUS
   *  3. Busca el turno y verifica que el usuario logueado sea el barbero dueño
   *  4. Actualiza el estado y el timestamp de modificación
   *  5. Si el nuevo estado es 'cancelled', libera el slot asociado
   */
  async 'appointments.updateStatus'({ appointmentId, status }) {
    // Validación de tipos para prevenir inyección de datos
    check(appointmentId, String);
    check(status, String);

    // Verificar que el estado proporcionado sea uno de los valores permitidos
    const validStatuses = Object.values(APPOINTMENT_STATUS);
    if (!validStatuses.includes(status)) {
      throw new Meteor.Error('invalid-status', 'Estado inválido');
    }

    // Buscar el turno para verificar su existencia y obtener el barberId
    const appt = await Appointments.findOneAsync(appointmentId);
    if (!appt) throw new Meteor.Error('not-found', 'Turno no encontrado');

    // Control de acceso: solo el barbero dueño del turno puede modificar su estado
    // this.userId es el ID del usuario que invoca el método desde el cliente
    if (this.userId !== appt.barberId) {
      throw new Meteor.Error('not-authorized', 'No tienes permiso');
    }

    // Actualizar el estado del turno y registrar el timestamp de modificación
    await Appointments.updateAsync(appointmentId, {
      $set: { status, updatedAt: new Date() }
    });

    // Si se cancela el turno, liberar el slot para que otros clientes puedan reservarlo
    if (status === APPOINTMENT_STATUS.CANCELLED) {
      await Slots.updateAsync(appt.slotId, {
        $set: { isAvailable: true, appointmentId: null }
      });
    }
  },

  /**
   * appointments.cancel
   * Cancela un turno y libera su slot sin verificar autoría.
   * Diseñado para que el propio cliente pueda cancelar su reserva.
   *
   * @param {String} appointmentId - ID del turno a cancelar
   *
   * Lógica interna:
   *  1. Valida el tipo del parámetro
   *  2. Verifica que el turno exista
   *  3. Actualiza el estado a 'cancelled' y registra el timestamp de cancelación
   *  4. Libera el slot asociado para que vuelva a estar disponible
   */
  async 'appointments.cancel'({ appointmentId }) {
    // Validación del tipo del parámetro de entrada
    check(appointmentId, String);

    // Obtener el turno para luego poder referenciar su slotId
    const appt = await Appointments.findOneAsync(appointmentId);
    if (!appt) throw new Meteor.Error('not-found', 'Turno no encontrado');

    // Marcar el turno como cancelado y registrar cuándo ocurrió
    await Appointments.updateAsync(appointmentId, {
      $set: { status: APPOINTMENT_STATUS.CANCELLED, cancelledAt: new Date() }
    });

    // Liberar el slot asociado para que pueda ser reservado nuevamente
    await Slots.updateAsync(appt.slotId, {
      $set: { isAvailable: true, appointmentId: null }
    });
  },
});
