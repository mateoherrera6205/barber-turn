import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Appointments } from './appointments';
import { Slots } from '../slots/slots';
import { APPOINTMENT_STATUS } from '/imports/utils/constants';

Meteor.methods({
  async 'appointments.book'({ slotId, clientName, clientPhone }) {
    check(slotId, String);
    check(clientName, String);
    check(clientPhone, String);

    const slot = await Slots.findOneAsync({ _id: slotId, isAvailable: true });
    if (!slot) throw new Meteor.Error('slot-unavailable', 'Este turno ya no está disponible');

    const appointmentId = await Appointments.insertAsync({
      slotId,
      clientName,
      clientPhone,
      barberId: slot.barberId,
      date: slot.date,
      hour: slot.hour,
      status: 'pending',
      createdAt: new Date(),
    });

    await Slots.updateAsync(slotId, {
      $set: { isAvailable: false, appointmentId }
    });

    return appointmentId;
  },

  async 'appointments.updateStatus'({ appointmentId, status }) {
    check(appointmentId, String);
    check(status, String);

    const validStatuses = Object.values(APPOINTMENT_STATUS);
    if (!validStatuses.includes(status)) {
      throw new Meteor.Error('invalid-status', 'Estado inválido');
    }

    const appt = await Appointments.findOneAsync(appointmentId);
    if (!appt) throw new Meteor.Error('not-found', 'Turno no encontrado');

    if (this.userId !== appt.barberId) {
      throw new Meteor.Error('not-authorized', 'No tienes permiso');
    }

    await Appointments.updateAsync(appointmentId, {
      $set: { status, updatedAt: new Date() }
    });

    if (status === APPOINTMENT_STATUS.CANCELLED) {
      await Slots.updateAsync(appt.slotId, {
        $set: { isAvailable: true, appointmentId: null }
      });
    }
  },

  async 'appointments.cancel'({ appointmentId }) {
    check(appointmentId, String);

    const appt = await Appointments.findOneAsync(appointmentId);
    if (!appt) throw new Meteor.Error('not-found', 'Turno no encontrado');

    await Appointments.updateAsync(appointmentId, {
      $set: { status: APPOINTMENT_STATUS.CANCELLED, cancelledAt: new Date() }
    });

    await Slots.updateAsync(appt.slotId, {
      $set: { isAvailable: true, appointmentId: null }
    });
  },
});
