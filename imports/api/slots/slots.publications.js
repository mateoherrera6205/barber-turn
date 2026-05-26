import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Slots } from './slots';

Meteor.publish('slots.available', function({ date }) {
  check(date, Date);

  // Usar rango del día completo en vez de igualdad exacta
  // para evitar problemas de milisegundos en comparación de fechas
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);

  return Slots.find({
    date: { $gte: start, $lte: end },
    isAvailable: true,
  });
});

Meteor.publish('slots.myDay', function({ date }) {
  check(date, Date);
  if (!this.userId) return this.ready();

  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);

  return Slots.find({
    barberId: this.userId,
    date: { $gte: start, $lte: end },
  });
});