/**
 * SimpleAverageStrategy — estrategia de promedio simple
 *
 * Replica el algoritmo original: divide el total de confirmados entre
 * el número de semanas únicas en el historial. Cada semana tiene el
 * mismo peso sin importar qué tan antigua sea.
 *
 * Usar cuando el historial es corto o la demanda es estable en el tiempo.
 */
import { PredictionStrategy } from './PredictionStrategy';

export class SimpleAverageStrategy extends PredictionStrategy {
  /**
   * @param {Object[]} appointments — historial de turnos confirmed/cancelled
   * @returns {Object[]} Predicciones calculadas con promedio simple
   */
  calculate(appointments) {
    // Calcular cuántas semanas distintas hay en el historial
    const semanasUnicas = new Set(
      appointments.map(a => Math.floor(new Date(a.date).getTime() / (7 * 24 * 60 * 60 * 1000)))
    );
    const totalSemanas = Math.max(semanasUnicas.size, 1);

    const predicciones = [];

    for (const diaSemana of PredictionStrategy.DIAS) {
      for (const hora of PredictionStrategy.HORAS) {
        const apptsDiaHora = appointments.filter(a => {
          const d = new Date(a.date);
          return d.getDay() === diaSemana && a.hour === hora;
        });

        const confirmados = apptsDiaHora.filter(a => a.status === 'confirmed').length;
        const cancelados  = apptsDiaHora.filter(a => a.status === 'cancelled').length;
        const total       = confirmados + cancelados;

        const clientesEsperados    = parseFloat((confirmados / totalSemanas).toFixed(2));
        const barberosRecomendados = Math.max(Math.ceil(clientesEsperados), 1);
        const ocupacionHistorica   = total > 0 ? parseFloat((confirmados / total).toFixed(2)) : 0;
        const alerta               = PredictionStrategy.detectarAlerta(
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
