/**
 * appointments.methods.js  (refactorizado — SRP + DIP)
 *
 * Cada método ahora tiene una única responsabilidad:
 *   1. Validar tipos con check()
 *   2. Verificar autenticación con this.userId
 *   3. Delegar la lógica de negocio al AppointmentService
 *
 * La lógica de negocio vive en AppointmentService (SRP).
 * Los métodos dependen del servicio, no de las colecciones Mongo (DIP).
 */
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { APPOINTMENT_STATUS } from '/imports/utils/constants';
import { AppointmentsRepository } from '../repositories/AppointmentsRepository';
import { SlotsRepository } from '../repositories/SlotsRepository';
import { AppointmentService } from '../services/AppointmentService';

// Instanciar repositorios e inyectarlos en el servicio (DIP por constructor)
const appointmentsRepo = new AppointmentsRepository();
const slotsRepo = new SlotsRepository();
const service = new AppointmentService({ appointmentsRepo, slotsRepo });

Meteor.methods({
  /**
   * appointments.book
   * Valida input y delega la reserva al servicio.
   * @returns {String} _id del appointment creado
   */
  async 'appointments.book'({ slotId, clientName, clientPhone }) {
    check(slotId, String);
    check(clientName, String);
    check(clientPhone, String);
    return service.book({ slotId, clientName, clientPhone });
  },

  /**
   * appointments.updateStatus
   * Valida input, verifica sesión, y delega al servicio.
   * El control de acceso (solo el barbero dueño) está en AppointmentService.
   */
  async 'appointments.updateStatus'({ appointmentId, status }) {
    check(appointmentId, String);
    check(status, String);

    const validStatuses = Object.values(APPOINTMENT_STATUS);
    if (!validStatuses.includes(status)) {
      throw new Meteor.Error('invalid-status', 'Estado inválido');
    }

    if (!this.userId) throw new Meteor.Error('not-logged-in', 'Debes iniciar sesión');
    return service.updateStatus({ appointmentId, status, requestingUserId: this.userId });
  },

  /**
   * appointments.cancel
   * Valida input, verifica sesión, y delega al servicio.
   *
   * Bug fix: la versión anterior no verificaba autoría (cualquiera podía cancelar
   * cualquier turno). Ahora se requiere sesión y el servicio comprueba que el
   * solicitante sea el barbero dueño del turno.
   */
  async 'appointments.cancel'({ appointmentId }) {
    check(appointmentId, String);
    if (!this.userId) throw new Meteor.Error('not-logged-in', 'Debes iniciar sesión');
    return service.cancel({ appointmentId, requestingUserId: this.userId });
  },
});
