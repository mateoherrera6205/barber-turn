/**
 * PredictionStrategy — clase base del patrón Strategy
 *
 * Define el contrato (interfaz) que deben cumplir todas las estrategias
 * de cálculo de predicciones. Cada subclase implementa calculate() con
 * su propio algoritmo, sin cambiar el código que llama al cálculo.
 *
 * También centraliza las constantes de dominio (HORAS, DIAS) y la función
 * detectarAlerta para que todas las estrategias compartan la misma lógica
 * de clasificación sin duplicarla.
 */
export class PredictionStrategy {
  /** Franjas horarias del sistema (igual que el SlotGenerator). */
  static HORAS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

  /** Días laborables: 1=Lun … 6=Sáb (se excluye Domingo=0). */
  static DIAS = [1, 2, 3, 4, 5, 6];

  /**
   * Clasifica el estado de una franja horaria según sus métricas.
   * @param {Number} clientesEsperados
   * @param {Number} barberosRecomendados
   * @param {Number} ocupacion  — ratio 0 a 1
   * @returns {'ok'|'demanda_alta'|'overbooking'|'sobrecapacidad'}
   */
  static detectarAlerta(clientesEsperados, barberosRecomendados, ocupacion) {
    if (ocupacion > 0.85) return 'demanda_alta';
    if (clientesEsperados > barberosRecomendados) return 'overbooking';
    if (barberosRecomendados > 3 && clientesEsperados < barberosRecomendados * 0.4) return 'sobrecapacidad';
    return 'ok';
  }

  /**
   * Calcula las predicciones a partir del historial de turnos.
   * Las subclases DEBEN sobreescribir este método.
   *
   * @param {Object[]} appointments  — array de turnos históricos (confirmed/cancelled)
   * @returns {Object[]} Array de predicciones con el esquema de la colección Predictions
   */
  calculate(appointments) {
    throw new Error(`${this.constructor.name} debe implementar calculate(appointments)`);
  }
}
