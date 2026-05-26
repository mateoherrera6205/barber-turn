import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Appointments } from '../imports/api/appointments/appointments';
import '../imports/api/appointments/appointments.methods';
import '../imports/api/appointments/appointments.publications';
import '../imports/api/slots/slots.methods';
import '../imports/api/slots/slots.publications';
import '../imports/startup/server/accounts';
import '../imports/api/users/users.methods';
import '../imports/api/analytics/analytics.publications';
import { runSeed } from '../bot/seed';

Meteor.startup(async () => {
  const count = await Meteor.users.find().countAsync();
  if (count === 0) {
    await Accounts.createUser({
      email: 'barbero@demo.com',
      password: '123456',
      profile: { name: 'Carlos el Barbero', role: 'barbero' }
    });
  }

  // Correr seed si hay pocos datos históricos
  const totalAppointments = await Appointments.find().countAsync();
  if (totalAppointments < 50) {
    console.log('📊 Iniciando generación de datos históricos...');
    await runSeed();
  }
});
