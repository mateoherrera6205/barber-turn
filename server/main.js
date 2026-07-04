import './api';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Appointments } from '../imports/api/appointments/appointments';
import { Predictions } from '../imports/api/predictions/predictions';
import '../imports/api/appointments/appointments.methods';
import '../imports/api/appointments/appointments.publications';
import '../imports/api/slots/slots.methods';
import '../imports/api/slots/slots.publications';
import '../imports/startup/server/accounts';
import '../imports/api/users/users.methods';
import '../imports/api/analytics/analytics.publications';
import '../imports/api/predictions/predictions.methods';
import '../imports/api/predictions/predictions.publications';
import { runSeed } from '../bot/seed';
import { calcularPredicciones } from '../imports/api/predictions/predictions.methods';

Meteor.startup(async () => {
  const count = await Meteor.users.find().countAsync();
  if (count === 0) {
    await Accounts.createUser({
      email: 'barbero@demo.com',
      password: '123456',
      profile: { name: 'Carlos el Barbero', role: 'barbero' }
    });
  }

  const totalAppointments = await Appointments.find().countAsync();
  if (totalAppointments < 50) {
    console.log('📊 Iniciando generación de datos históricos...');
    await runSeed();
  }

  const totalPreds = await Predictions.find().countAsync();
  if (totalPreds === 0) {
    console.log('Calculando predicciones iniciales...');
    const barbero = await Meteor.users.findOneAsync({ 'profile.role': 'barbero' });
    if (barbero) {
      await Meteor.callAsync('predictions.calculate');
    }
  }
});