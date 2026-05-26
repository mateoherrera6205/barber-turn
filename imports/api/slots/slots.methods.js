import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Slots } from './slots';

Meteor.methods({
  async 'slots.generateForDay'({ date, hours }) {
    check(date, Date);
    check(hours, [String]);

    if (!this.userId) throw new Meteor.Error('not-logged-in', 'Debes iniciar sesión');
    await Slots.removeAsync({
      barberId: this.userId,
      date,
      isAvailable: true,
    });

    for (const hour of hours) {
      await Slots.insertAsync({
        barberId: this.userId,
        date,
        hour,
        isAvailable: true,
        appointmentId: null,
        createdAt: new Date(),
      });
    }
  },
});
