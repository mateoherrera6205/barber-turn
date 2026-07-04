/**
 * AppointmentsRepository — patrón Repository + principio DIP
 *
 * Encapsula TODAS las operaciones Mongo sobre la colección Appointments.
 * El resto del sistema depende de esta clase, no de la colección directamente,
 * lo que permite cambiar la fuente de datos sin tocar la lógica de negocio.
 */
import { Appointments } from '../appointments/appointments';
import { APPOINTMENT_STATUS } from '/imports/utils/constants';

export class AppointmentsRepository {
  /** Devuelve todos los turnos que coincidan con el selector dado. */
  async findAll(selector = {}) {
    return Appointments.find(selector).fetchAsync();
  }

  /** Busca un turno por _id. Devuelve undefined si no existe. */
  async findById(id) {
    return Appointments.findOneAsync(id);
  }

  /** Devuelve todos los turnos con un status específico. */
  async findByStatus(status) {
    return Appointments.find({ status }).fetchAsync();
  }

  /**
   * Devuelve los turnos confirmados o cancelados (historial resuelto).
   * Excluye los 'pending' porque aún no tienen resultado definitivo.
   */
  async findHistorical() {
    return Appointments.find({
      status: { $in: [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.CANCELLED] },
    }).fetchAsync();
  }

  /**
   * Consulta flexible para el API REST: filtra por status si se provee.
   * Encapsula la construcción del selector de Mongo.
   */
  async findWithFilters({ status } = {}) {
    const selector = {};
    if (status) selector.status = status;
    return Appointments.find(selector).fetchAsync();
  }

  /** Inserta un nuevo turno y devuelve su _id. */
  async insert(data) {
    return Appointments.insertAsync(data);
  }

  /**
   * Actualiza el estado de un turno y registra el timestamp de modificación.
   * `extra` permite añadir campos adicionales (p.ej. cancelledAt).
   */
  async setStatus(id, status, extra = {}) {
    return Appointments.updateAsync(id, {
      $set: { status, updatedAt: new Date(), ...extra },
    });
  }

  /** Cancela un turno y registra cuándo ocurrió. */
  async cancel(id) {
    return Appointments.updateAsync(id, {
      $set: {
        status: APPOINTMENT_STATUS.CANCELLED,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}
