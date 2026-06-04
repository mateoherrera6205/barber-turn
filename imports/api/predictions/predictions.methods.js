/**
 * predictions.methods.js
 * Contiene el algoritmo de predicción de demanda de BarberTurn y el método
 * Meteor que lo expone al cliente.
 *
 * El algoritmo analiza el historial de appointments (confirmados y cancelados)
 * de las últimas N semanas para calcular, por cada combinación día-hora:
 *  - Cuántos clientes se esperan en promedio
 *  - Cuántos barberos se necesitan para cubrir esa demanda
 *  - El porcentaje histórico de ocupación real
 *  - Una alerta si la situación es anómala
 *
 * Métodos disponibles:
 *  - predictions.calculate → Ejecuta el recálculo completo de predicciones
 */
import { Meteor } from 'meteor/meteor';
import { Appointments } from '/imports/api/appointments/appointments';
import { Predictions } from './predictions';

// Franjas horarias del sistema (las mismas que ofrece el SlotGenerator)
const HORAS = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];

// Días laborables: 1=Lunes a 6=Sábado (se excluye Domingo = 0)
const DIAS  = [1, 2, 3, 4, 5, 6];

/**
 * detectarAlerta
 * Clasifica el estado de una franja horaria según sus métricas para alertar
 * sobre situaciones que requieren atención en la planificación.
 *
 * @param {Number} clientesEsperados     - Promedio de clientes que se esperan
 * @param {Number} barberosRecomendados  - Barberos calculados para cubrir la demanda
 * @param {Number} ocupacion             - Ratio de ocupación histórica (0 a 1)
 *
 * Clasificaciones posibles:
 *  - 'demanda_alta':   ocupación histórica > 85% (riesgo de no poder atender a todos)
 *  - 'overbooking':    más clientes esperados que barberos disponibles
 *  - 'sobrecapacidad': muchos barberos pero poca demanda (desperdicio de recursos)
 *  - 'ok':             situación normal y equilibrada
 *
 * @returns {String} Código de alerta: 'ok' | 'demanda_alta' | 'overbooking' | 'sobrecapacidad'
 */
const detectarAlerta = (clientesEsperados, barberosRecomendados, ocupacion) => {
  // Si más del 85% de slots históricos terminaron en confirmed → alta demanda
  if (ocupacion > 0.85) return 'demanda_alta';

  // Si se esperan más clientes que barberos disponibles → riesgo de no poder atenderlos
  if (clientesEsperados > barberosRecomendados) return 'overbooking';

  // Si hay más de 3 barberos recomendados pero la demanda es menos del 40% de la capacidad
  // → demasiados barberos para poca demanda (sobrecapacidad)
  if (barberosRecomendados > 3 && clientesEsperados < barberosRecomendados * 0.4) return 'sobrecapacidad';

  // Situación equilibrada
  return 'ok';
};

/**
 * calcularPredicciones
 * Función principal del algoritmo de predicción. Se exporta también para poder
 * llamarla directamente desde server/main.js al inicializar el sistema.
 *
 * Algoritmo paso a paso:
 *  1. Obtiene todos los appointments históricos con estado 'confirmed' o 'cancelled'
 *     (se excluyen los 'pending' por ser datos aún no resueltos)
 *  2. Calcula cuántas semanas distintas están representadas en el historial
 *     usando el número de semana desde epoch (floor(timestamp / 7días))
 *  3. Para cada combinación (día de semana × hora):
 *     a. Filtra los appointments de esa combinación específica
 *     b. Cuenta confirmados y cancelados por separado
 *     c. Calcula el promedio de clientes por semana = confirmados / totalSemanas
 *     d. Calcula los barberos recomendados = ceil(clientesEsperados), mínimo 1
 *     e. Calcula la ocupación histórica = confirmados / (confirmados + cancelados)
 *     f. Detecta la alerta según las métricas calculadas
 *  4. Borra todas las predicciones anteriores y guarda las nuevas
 *
 * @returns {Number} Cantidad de predicciones calculadas e insertadas
 */
export const calcularPredicciones = async () => {
  console.log('🔮 Calculando predicciones...');

  // Paso 1: Obtener el historial completo de appointments resueltos (confirmados o cancelados)
  // Se excluyen los 'pending' porque aún no tienen resultado definitivo
  const appointments = await Appointments.find({
    status: { $in: ['confirmed', 'cancelled'] }
  }).fetchAsync();

  // Paso 2: Calcular cuántas semanas distintas hay en el historial
  // Se divide el timestamp en milisegundos entre los ms de una semana para obtener
  // el número de semana desde la época Unix, y se usa un Set para deduplicar
  const semanasUnicas = new Set(
    appointments.map(a => {
      const d = new Date(a.date);
      // Math.floor(ms / ms_por_semana) = número de semana desde epoch
      return Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000));
    })
  );

  // Si no hay datos históricos, usar 1 semana para evitar división por cero
  const totalSemanas = Math.max(semanasUnicas.size, 1);

  // Array que acumulará todas las predicciones calculadas
  const predicciones = [];

  // Paso 3: Iterar sobre cada combinación día × hora para calcular las métricas
  for (const diaSemana of DIAS) {
    for (const hora of HORAS) {

      // Filtrar appointments de este día de semana y hora específica
      // getDay() retorna 0=Dom, 1=Lun... 6=Sáb, coincidiendo con DIAS
      const apptsDiaHora = appointments.filter(a => {
        const d = new Date(a.date);
        return d.getDay() === diaSemana && a.hour === hora;
      });

      // Contar por estado para calcular las métricas
      const confirmados           = apptsDiaHora.filter(a => a.status === 'confirmed').length;
      const cancelados            = apptsDiaHora.filter(a => a.status === 'cancelled').length;
      const total                 = confirmados + cancelados;

      // Paso 3c: Promedio de clientes confirmados por semana en esta franja
      // (confirmados acumulados en todas las semanas / número de semanas)
      const clientesEsperados     = parseFloat((confirmados / totalSemanas).toFixed(2));

      // Paso 3d: Mínimo de barberos necesarios = redondear hacia arriba, al menos 1
      const barberosRecomendados  = Math.max(Math.ceil(clientesEsperados), 1);

      // Paso 3e: Porcentaje de slots que terminaron confirmados (0 si no hay datos)
      const ocupacionHistorica    = total > 0 ? parseFloat((confirmados / total).toFixed(2)) : 0;

      // Paso 3f: Clasificar el estado de la franja
      const alerta                = detectarAlerta(clientesEsperados, barberosRecomendados, ocupacionHistorica);

      // Acumular la predicción de esta franja
      predicciones.push({
        diaSemana, hora, clientesEsperados,
        barberosRecomendados, ocupacionHistorica,
        alerta, semanasTomadas: totalSemanas,
        updatedAt: new Date(),
      });
    }
  }

  // Paso 4: Reemplazar todas las predicciones anteriores por las recién calculadas
  // Se hace remove total primero para garantizar consistencia (no quedan datos viejos)
  await Predictions.removeAsync({});
  for (const pred of predicciones) {
    await Predictions.insertAsync(pred);
  }

  console.log(`✅ ${predicciones.length} predicciones calculadas`);
  return predicciones.length;
};

/**
 * predictions.calculate (Meteor Method)
 * Expone calcularPredicciones() como un método remoto invocable desde el cliente.
 * Solo usuarios autenticados pueden ejecutar el recálculo de predicciones.
 *
 * Usado en PredictionPage mediante el botón "Recalcular".
 *
 * @returns {Number} La cantidad de predicciones calculadas
 */
Meteor.methods({
  async 'predictions.calculate'() {
    // Solo usuarios logueados pueden iniciar el recálculo (barberos en la práctica)
    if (!this.userId) throw new Meteor.Error('not-logged-in');
    return await calcularPredicciones();
  }
});
