/**
 * AppointmentService — principios SRP + DIP
 *
 * SRP: concentra ÚNICAMENTE la lógica de negocio de reservar y cancelar turnos.
 *   Los métodos Meteor se encargan de validar input y verificar sesión;
 *   este servicio se encarga de las reglas de negocio.
 *
 * DIP: no importa ninguna colección Mongo directamente.
 *   Recibe los repositorios por constructor (inyección de dependencias),
 *   dependiendo de la abstracción (la clase repo) y no del detalle (Mongo).
 */
import { Meteor } from 'meteor/meteor';
import { APPOINTMENT_STATUS } from '/imports/utils/constants';

export class AppointmentService {
  /**
   * @param {AppointmentsRepository} appointmentsRepo
   * @param {SlotsRepository}        slotsRepo
   */
  constructor({ appointmentsRepo, slotsRepo }) {
    this.appointmentsRepo = appointmentsRepo;
    this.slotsRepo = slotsRepo;
  }

  /**
   * Reserva un turno en un slot disponible.
   * Valida que el slot exista y esté libre antes de crear el appointment.
   * @returns {String} _id del appointment creado
   */
  async book({ slotId, clientName, clientPhone }) {
    const slot = await this.slotsRepo.findAvailableById(slotId);
    if (!slot) throw new Meteor.Error('slot-unavailable', 'Este turno ya no está disponible');

    const appointmentId = await this.appointmentsRepo.insert({
      slotId,
      clientName,
      clientPhone,
      barberId: slot.barberId,
      date: slot.date,
      hour: slot.hour,
      status: APPOINTMENT_STATUS.PENDING,
      createdAt: new Date(),
    });

    await this.slotsRepo.markAsBooked(slotId, appointmentId);
    return appointmentId;
  }

  /**
   * Cambia el estado de un turno. Solo el barbero dueño puede hacerlo.
   * Si el nuevo estado es 'cancelled', libera el slot asociado.
   */
  async updateStatus({ appointmentId, status, requestingUserId }) {
    const appt = await this.appointmentsRepo.findById(appointmentId);
    if (!appt) throw new Meteor.Error('not-found', 'Turno no encontrado');

    if (requestingUserId !== appt.barberId) {
      throw new Meteor.Error('not-authorized', 'No tienes permiso');
    }

    await this.appointmentsRepo.setStatus(appointmentId, status);

    if (status === APPOINTMENT_STATUS.CANCELLED) {
      await this.slotsRepo.markAsAvailable(appt.slotId);
    }
  }

  /**
   * Cancela un turno y libera su slot.
   *
   * Bug fix: la versión anterior no verificaba autoría, permitiendo que cualquier
   * usuario (o incluso llamadas anónimas) cancelara cualquier turno.
   * Ahora solo el barbero dueño del turno puede cancelarlo.
   *
   * Nota: el "cliente dueño" no puede verificarse porque el modelo de Appointments
   * no almacena un clientId (los clientes reservan sin cuenta). Agregar ese campo
   * permitiría ampliar la autorización en una iteración futura.
   */
  async cancel({ appointmentId, requestingUserId }) {
    const appt = await this.appointmentsRepo.findById(appointmentId);
    if (!appt) throw new Meteor.Error('not-found', 'Turno no encontrado');

    if (requestingUserId !== appt.barberId) {
      throw new Meteor.Error('not-authorized', 'Solo el barbero dueño puede cancelar este turno');
    }

    await this.appointmentsRepo.cancel(appointmentId);
    await this.slotsRepo.markAsAvailable(appt.slotId);
  }
}
