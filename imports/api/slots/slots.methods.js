/**
 * slots.methods.js
 * Define los métodos Meteor (RPC del servidor) para gestión de slots horarios.
 * Los slots son las franjas horarias que el barbero habilita para recibir clientes.
 *
 * Métodos disponibles:
 *  - slots.generateForDay → Genera los slots disponibles para un día específico
 *  - slots.assign         → Asigna (crea idempotente) un slot para cualquier barbero
 *  - slots.unassign       → Elimina un slot libre; lanza error si está ocupado
 */
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Slots } from './slots';
import { normalizarFecha } from '/imports/utils/fechas';

Meteor.methods({
  /**
   * slots.generateForDay
   * Genera o regenera los slots disponibles para un barbero en una fecha dada.
   * Primero elimina los slots libres existentes en esa fecha para ese barbero,
   * luego inserta los nuevos slots con las horas seleccionadas.
   *
   * @param {Date}     date  - Fecha para la que se generan los slots
   * @param {String[]} hours - Array de horas en formato 'HH:MM' (ej: ['09:00','10:00'])
   */
  async 'slots.generateForDay'({ date, hours }) {
    check(date, Date);
    check(hours, [String]);

    if (!this.userId) throw new Meteor.Error('not-logged-in', 'Debes iniciar sesión');

    // Normalizar a UTC 5h para ser consistente con seed y BookingPage
    const fechaNorm = normalizarFecha(date);

    await Slots.removeAsync({
      barberId: this.userId,
      date: fechaNorm,
      isAvailable: true,
    });

    for (const hour of hours) {
      await Slots.insertAsync({
        barberId: this.userId,
        date: fechaNorm,
        hour,
        isAvailable: true,
        appointmentId: null,
        createdAt: new Date(),
      });
    }
  },

  /**
   * slots.assign
   * Asigna una franja horaria a cualquier barbero (gestión por el planificador).
   * Idempotente: si ya existe (barberId, date, hour) retorna su _id sin duplicar.
   *
   * @param {String} barberId - ID del barbero a asignar
   * @param {Date}   date     - Fecha del slot (se normaliza internamente)
   * @param {String} hour     - Hora en formato 'HH:MM'
   * @returns {String} _id del slot existente o recién creado
   */
  async 'slots.assign'({ barberId, date, hour }) {
    check(barberId, String);
    check(date, Date);
    check(hour, String);

    if (!this.userId) throw new Meteor.Error('not-logged-in', 'Debes iniciar sesión');

    const gestor = await Meteor.users.findOneAsync(this.userId);
    if (gestor?.profile?.role !== 'barbero') {
      throw new Meteor.Error('not-authorized', 'Solo barberos pueden asignar slots');
    }

    const barbero = await Meteor.users.findOneAsync(barberId);
    if (!barbero || barbero.profile?.role !== 'barbero') {
      throw new Meteor.Error('barbero-invalido', 'El usuario no es un barbero válido');
    }

    const fechaNorm = normalizarFecha(date);

    const existing = await Slots.findOneAsync({ barberId, date: fechaNorm, hour });
    if (existing) return existing._id;

    return Slots.insertAsync({
      barberId,
      date: fechaNorm,
      hour,
      isAvailable: true,
      appointmentId: null,
      createdAt: new Date(),
    });
  },

  /**
   * slots.unassign
   * Elimina una franja horaria si está libre.
   * Lanza 'slot-ocupado' si tiene una reserva activa (para no perder el turno).
   *
   * @param {String} barberId - ID del barbero dueño del slot
   * @param {Date}   date     - Fecha del slot (se normaliza internamente)
   * @param {String} hour     - Hora en formato 'HH:MM'
   */
  async 'slots.unassign'({ barberId, date, hour }) {
    check(barberId, String);
    check(date, Date);
    check(hour, String);

    if (!this.userId) throw new Meteor.Error('not-logged-in', 'Debes iniciar sesión');

    const gestor = await Meteor.users.findOneAsync(this.userId);
    if (gestor?.profile?.role !== 'barbero') {
      throw new Meteor.Error('not-authorized', 'Solo barberos pueden quitar slots');
    }

    const fechaNorm = normalizarFecha(date);
    const slot = await Slots.findOneAsync({ barberId, date: fechaNorm, hour });

    if (!slot) throw new Meteor.Error('slot-no-existe', 'El slot no existe');

    if (!slot.isAvailable) {
      throw new Meteor.Error(
        'slot-ocupado',
        'La franja tiene una reserva; cancélala primero desde el Dashboard'
      );
    }

    await Slots.removeAsync(slot._id);
  },
});
