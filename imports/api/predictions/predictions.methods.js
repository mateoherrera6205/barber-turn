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
 * El nombre del método Meteor y la firma de calcularPredicciones no cambian,
 * por lo que server/main.js y el cliente siguen funcionando sin modificaciones.
 */
import { Meteor } from 'meteor/meteor';
import { Appointments } from '/imports/api/appointments/appointments';
import { Predictions } from './predictions';
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
 * calcularPredicciones
 * Orquesta el proceso completo: obtiene datos, delega el cálculo a la
 * estrategia y persiste los resultados en la colección Predictions.
 *
 * @param {'simple'|'weighted'} strategyName — algoritmo a usar (default: 'simple')
 * @returns {Number} Cantidad de predicciones calculadas e insertadas
 */
export const calcularPredicciones = async (strategyName = 'simple') => {
  console.log(`🔮 Calculando predicciones con estrategia: ${strategyName}...`);

  // Obtener historial de turnos resueltos (la estrategia no accede a Mongo)
  const appointments = await Appointments.find({
    status: { $in: ['confirmed', 'cancelled'] },
  }).fetchAsync();

  // Seleccionar e invocar la estrategia elegida (patrón Strategy)
  const strategy = selectStrategy(strategyName);
  const predicciones = strategy.calculate(appointments);

  // Persistir: eliminar predicciones anteriores e insertar las nuevas
  await Predictions.removeAsync({});
  for (const pred of predicciones) {
    await Predictions.insertAsync(pred);
  }

  console.log(`✅ ${predicciones.length} predicciones calculadas`);
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
