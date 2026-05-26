import { Meteor } from 'meteor/meteor';
import { Appointments } from '/imports/api/appointments/appointments';
import { Slots } from '/imports/api/slots/slots';

Meteor.publish('analytics.overview', function() {
  if (!this.userId) return this.ready();
  return [
    Appointments.find({}, { fields: { barberId: 1, date: 1, hour: 1, status: 1 } }),
    Slots.find({}, { fields: { barberId: 1, date: 1, hour: 1, isAvailable: 1 } }),
  ];
});
