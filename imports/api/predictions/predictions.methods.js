import { Meteor } from 'meteor/meteor';
import { Appointments } from '/imports/api/appointments/appointments';
import { Predictions } from './predictions';

const HORAS = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];
const DIAS  = [1, 2, 3, 4, 5, 6];

const detectarAlerta = (clientesEsperados, barberosRecomendados, ocupacion) => {
  if (ocupacion > 0.85) return 'demanda_alta';
  if (clientesEsperados > barberosRecomendados) return 'overbooking';
  if (barberosRecomendados > 3 && clientesEsperados < barberosRecomendados * 0.4) return 'sobrecapacidad';
  return 'ok';
};

export const calcularPredicciones = async () => {
  console.log('🔮 Calculando predicciones...');

  const appointments = await Appointments.find({
    status: { $in: ['confirmed', 'cancelled'] }
  }).fetchAsync();

  const semanasUnicas = new Set(
    appointments.map(a => {
      const d = new Date(a.date);
      return Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000));
    })
  );
  const totalSemanas = Math.max(semanasUnicas.size, 1);

  const predicciones = [];

  for (const diaSemana of DIAS) {
    for (const hora of HORAS) {
      const apptsDiaHora = appointments.filter(a => {
        const d = new Date(a.date);
        return d.getDay() === diaSemana && a.hour === hora;
      });

      const confirmados           = apptsDiaHora.filter(a => a.status === 'confirmed').length;
      const cancelados            = apptsDiaHora.filter(a => a.status === 'cancelled').length;
      const total                 = confirmados + cancelados;
      const clientesEsperados     = parseFloat((confirmados / totalSemanas).toFixed(2));
      const barberosRecomendados  = Math.max(Math.ceil(clientesEsperados), 1);
      const ocupacionHistorica    = total > 0 ? parseFloat((confirmados / total).toFixed(2)) : 0;
      const alerta                = detectarAlerta(clientesEsperados, barberosRecomendados, ocupacionHistorica);

      predicciones.push({
        diaSemana, hora, clientesEsperados,
        barberosRecomendados, ocupacionHistorica,
        alerta, semanasTomadas: totalSemanas,
        updatedAt: new Date(),
      });
    }
  }

  await Predictions.removeAsync({});
  for (const pred of predicciones) {
    await Predictions.insertAsync(pred);
  }

  console.log(`✅ ${predicciones.length} predicciones calculadas`);
  return predicciones.length;
};

Meteor.methods({
  async 'predictions.calculate'() {
    if (!this.userId) throw new Meteor.Error('not-logged-in');
    return await calcularPredicciones();
  }
});
