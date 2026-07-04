/**
 * SlotsRepository — patrón Repository + principio DIP
 *
 * Encapsula TODAS las operaciones Mongo sobre la colección Slots.
 * Expone métodos con nombres de dominio en lugar de operaciones CRUD crudas,
 * ocultando los detalles de MongoDB al resto del sistema.
 */
import { Slots } from '../slots/slots';

export class SlotsRepository {
  /** Busca un slot por _id. Devuelve undefined si no existe. */
  async findById(id) {
    return Slots.findOneAsync(id);
  }

  /**
   * Busca un slot disponible por _id.
   * Combina la búsqueda por ID con el filtro isAvailable en una sola consulta
   * para evitar condiciones de carrera al reservar.
   */
  async findAvailableById(id) {
    return Slots.findOneAsync({ _id: id, isAvailable: true });
  }

  /**
   * Consulta flexible para el API REST: filtra por fecha y/o disponibilidad.
   * `status` es un string 'available' | 'unavailable' que se mapea a isAvailable.
   * Encapsula la construcción del rango UTC del día y el selector de Mongo.
   */
  async findWithFilters({ date, status } = {}) {
    const selector = {};

    if (date) {
      const start = new Date(date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999);
      selector.date = { $gte: start, $lte: end };
    }

    if (status !== undefined) {
      selector.isAvailable = status === 'available';
    }

    return Slots.find(selector).fetchAsync();
  }

  /** Marca un slot como ocupado y le asocia el appointmentId. */
  async markAsBooked(id, appointmentId) {
    return Slots.updateAsync(id, {
      $set: { isAvailable: false, appointmentId },
    });
  }

  /** Libera un slot para que pueda ser reservado nuevamente. */
  async markAsAvailable(id) {
    return Slots.updateAsync(id, {
      $set: { isAvailable: true, appointmentId: null },
    });
  }

  /** Inserta un nuevo slot y devuelve su _id. */
  async insert(data) {
    return Slots.insertAsync(data);
  }

  /**
   * Elimina los slots disponibles de un barbero en una fecha específica.
   * Solo elimina los disponibles para preservar los ya reservados.
   */
  async removeAvailableByBarberAndDate(barberId, date) {
    return Slots.removeAsync({ barberId, date, isAvailable: true });
  }
}
