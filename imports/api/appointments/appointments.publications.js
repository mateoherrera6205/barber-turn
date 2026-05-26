import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Appointments } from './appointments';

Meteor.publish('appointments.myBarber', function() {
  if (!this.userId) return this.ready();
  return Appointments.find({
    barberId: this.userId,
    status: { $ne: 'cancelled' }
  }, {
    sort: { date: 1, hour: 1 }
  });
});

Meteor.publish('appointments.today', function() {
  if (!this.userId) return this.ready();
  const start = new Date();
  start.setUTCHours(5, 0, 0, 0);
  const end = new Date();
  end.setUTCHours(28, 59, 59, 999);
  return Appointments.find({
    barberId: this.userId,
    date: { $gte: start, $lte: end }
  });
});

Meteor.publish('appointments.all', function() {
  if (!this.userId) return this.ready();
  return Appointments.find({}, { sort: { date: -1 } });
});