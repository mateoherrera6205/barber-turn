/**
 * predictions.methods.js  (refactorizado — patrón Strategy + DIP)
 *
 * calcularPredicciones() ya no contiene el algoritmo directamente.
 * Ahora selecciona una estrategia y le delega el cálculo, siguiendo el
 * patrón Strategy: el algoritmo es intercambiable sin cambiar este módulo.
 *
 * Estrategias disponibles:
 *  - 'simple'   (default) → SimpleAverageStrategy: mismo resultado que antes
 *  - 'weighted'           → WeightedAverageStrategy: da más peso a semanas recientes
 *
 * Post-proceso (CAMBIO B/D):
 *  Enriquece cada predicción con capacidadProgramada, gap y riesgoCancelacion
 *  calculados a partir de los Slots existentes, recalcula la alerta con lógica
 *  correcta y persiste el plan de acción en StaffingPlan.
 */
import { Meteor } from 'meteor/meteor';
import { Appointments } from '/imports/api/appointments/appointments';
import { Slots } from '/imports/api/slots/slots';
import { Predictions } from './predictions';
import { StaffingPlan } from './staffingPlan';
import { StaffingPlanner } from './StaffingPlanner';
import { PredictionStrategy } from './strategies/PredictionStrategy';
import { SimpleAverageStrategy } from './strategies/SimpleAverageStrategy';
import { WeightedAverageStrategy } from './strategies/WeightedAverageStrategy';

/**
 * Selecciona la estrategia adecuada según el nombre recibido.
 * @param {'simple'|'weighted'} strategyName
 * @returns {PredictionStrategy}
 */
const selectStrategy = (strategyName) => {
  if (strategyName === 'weighted') return new WeightedAverageStrategy();
  return new SimpleAverageStrategy();
};

/**
 * Construye un Map "diaSemana-hora" → capacidadProgramada a partir de los
 * Slots existentes. La capacidadProgramada es el promedio semanal de barberos
 * distintos (barberId) que tienen un slot en esa franja.
 * @param {Object[]} slots
 * @returns {Map<string, number>}
 */
const buildCapacidadMap = (slots) => {
  // Agrupar por (semana, día, hora) → Set de barberIds únicos
  const weekGroups = new Map();
  for (const slot of slots) {
    const d = new Date(slot.date);
    const weekNum = Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000));
    const groupKey = `${weekNum}-${d.getDay()}-${slot.hour}`;
    if (!weekGroups.has(groupKey)) weekGroups.set(groupKey, new Set());
    weekGroups.get(groupKey).add(slot.barberId);
  }

  // Sumar barberIds únicos por (día, hora) a través de todas las semanas
  const sums  = new Map();
  const weeks = new Map();
  for (const [key, barbers] of weekGroups) {
    // key = "weekNum-day-HH:MM"; split('-') da [weekNum, day, "HH:MM"]
    const [, day, hour] = key.split('-');
    const dayHour = `${day}-${hour}`;
    sums.set(dayHour,  (sums.get(dayHour)  || 0) + barbers.size);
    weeks.set(dayHour, (weeks.get(dayHour) || 0) + 1);
  }

  const capacidadMap = new Map();
  for (const [dayHour, total] of sums) {
    capacidadMap.set(dayHour, Math.max(Math.round(total / weeks.get(dayHour)), 0));
  }
  return capacidadMap;
};

/**
 * calcularPredicciones
 * Orquesta el proceso completo: obtiene datos, delega el cálculo a la
 * estrategia, enriquece con capacidad real, persiste predicciones y plan.
 *
 * @param {'simple'|'weighted'} strategyName — algoritmo a usar (default: 'simple')
 * @returns {Number} Cantidad de predicciones calculadas e insertadas
 */
export const calcularPredicciones = async (strategyName = 'simple') => {
  console.log(`🔮 Calculando predicciones con estrategia: ${strategyName}...`);

  // Historial de turnos resueltos (la estrategia no accede a Mongo)
  const appointments = await Appointments.find({
    status: { $in: ['confirmed', 'cancelled'] },
  }).fetchAsync();

  // Capacidad programada real por franja (CAMBIO A)
  const slots = await Slots.find({}).fetchAsync();
  const capacidadMap = buildCapacidadMap(slots);

  // Calcular predicciones base con la estrategia elegida
  const strategy = selectStrategy(strategyName);
  const rawPredicciones = strategy.calculate(appointments);

  // Enriquecer con capacidad real y recalcular alerta (CAMBIO B)
  const predicciones = rawPredicciones.map(pred => {
    const capacidadProgramada = capacidadMap.get(`${pred.diaSemana}-${pred.hora}`) ?? 0;
    const gap = pred.barberosRecomendados - capacidadProgramada;
    const riesgoCancelacion = parseFloat((1 - pred.ocupacionHistorica).toFixed(2));
    const alerta = PredictionStrategy.detectarAlertaConCapacidad(
      gap, pred.clientesEsperados, capacidadProgramada, pred.ocupacionHistorica,
    );
    return { ...pred, capacidadProgramada, gap, riesgoCancelacion, alerta };
  });

  // Persistir predicciones enriquecidas
  await Predictions.removeAsync({});
  for (const pred of predicciones) {
    await Predictions.insertAsync(pred);
  }

  // Generar y persistir plan de acción (CAMBIO D)
  const plan = new StaffingPlanner().generarPlan(predicciones);
  await StaffingPlan.removeAsync({});
  for (const accion of plan) {
    await StaffingPlan.insertAsync({ ...accion, updatedAt: new Date() });
  }

  console.log(`✅ ${predicciones.length} predicciones calculadas, ${plan.length} acciones de staffing`);
  return predicciones.length;
};

/**
 * predictions.calculate (Meteor Method)
 * Expone calcularPredicciones() como RPC invocable desde el cliente.
 * Acepta un parámetro opcional strategyName para elegir el algoritmo.
 *
 * Llamada desde el cliente:
 *   Meteor.call('predictions.calculate')               → usa SimpleAverage
 *   Meteor.call('predictions.calculate', 'weighted')  → usa WeightedAverage
 */
Meteor.methods({
  async 'predictions.calculate'(strategyName = 'simple') {
    if (!this.userId) throw new Meteor.Error('not-logged-in');
    return calcularPredicciones(strategyName);
  },
});
