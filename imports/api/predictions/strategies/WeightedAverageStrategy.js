/**
 * WeightedAverageStrategy — estrategia de promedio ponderado
 *
 * Da más peso a las semanas recientes usando pesos lineales crecientes:
 * la semana más antigua recibe peso 1, la más reciente recibe peso N.
 *
 * Útil cuando la demanda está cambiando (negocio en crecimiento o
 * temporadas marcadas) y el historial reciente es más representativo.
 */
import { PredictionStrategy } from './PredictionStrategy';

export class WeightedAverageStrategy extends PredictionStrategy {
  /**
   * @param {Object[]} appointments — historial de turnos confirmed/cancelled
   * @returns {Object[]} Predicciones calculadas con promedio ponderado
   */
  calculate(appointments) {
    // Agrupar appointments por número de semana (desde epoch Unix)
    const appointmentsPorSemana = new Map();
    for (const a of appointments) {
      const semNum = Math.floor(new Date(a.date).getTime() / (7 * 24 * 60 * 60 * 1000));
      if (!appointmentsPorSemana.has(semNum)) appointmentsPorSemana.set(semNum, []);
      appointmentsPorSemana.get(semNum).push(a);
    }

    // Ordenar semanas de más antigua (índice 0) a más reciente (índice N-1)
    // El peso de cada semana = índice + 1, de modo que la más reciente pesa más
    const semanasOrdenadas = [...appointmentsPorSemana.keys()].sort((a, b) => a - b);
    const totalSemanas = Math.max(semanasOrdenadas.length, 1);

    const pesoPorSemana = {};
    semanasOrdenadas.forEach((semNum, idx) => { pesoPorSemana[semNum] = idx + 1; });
    const sumaPesos = Math.max(
      semanasOrdenadas.reduce((sum, semNum) => sum + pesoPorSemana[semNum], 0),
      1  // evitar división por cero cuando no hay semanas
    );

    const predicciones = [];

    for (const diaSemana of PredictionStrategy.DIAS) {
      for (const hora of PredictionStrategy.HORAS) {
        let confirmadosPonderados = 0;
        let canceladosPonderados  = 0;

        for (const [semNum, semAppts] of appointmentsPorSemana) {
          const peso = pesoPorSemana[semNum];
          const semDiaHora = semAppts.filter(a => {
            return new Date(a.date).getDay() === diaSemana && a.hour === hora;
          });
          confirmadosPonderados += semDiaHora.filter(a => a.status === 'confirmed').length * peso;
          canceladosPonderados  += semDiaHora.filter(a => a.status === 'cancelled').length * peso;
        }

        const totalPonderado     = confirmadosPonderados + canceladosPonderados;
        const clientesEsperados  = parseFloat((confirmadosPonderados / sumaPesos).toFixed(2));
        const barberosRecomendados = Math.max(Math.ceil(clientesEsperados), 1);
        const ocupacionHistorica = totalPonderado > 0
          ? parseFloat((confirmadosPonderados / totalPonderado).toFixed(2))
          : 0;
        const alerta = PredictionStrategy.detectarAlerta(
          clientesEsperados, barberosRecomendados, ocupacionHistorica
        );

        predicciones.push({
          diaSemana, hora, clientesEsperados,
          barberosRecomendados, ocupacionHistorica,
          alerta, semanasTomadas: totalSemanas,
          updatedAt: new Date(),
        });
      }
    }

    return predicciones;
  }
}
