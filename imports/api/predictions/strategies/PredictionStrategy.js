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
   * @deprecated Las alertas 'overbooking' y 'sobrecapacidad' son inalcanzables
   * porque barberosRecomendados = ceil(clientesEsperados) ≥ clientesEsperados siempre.
   * Usar detectarAlertaConCapacidad para comparar contra capacidad programada real.
   */
  static detectarAlerta(clientesEsperados, barberosRecomendados, ocupacion) {
    if (ocupacion > 0.85) return 'demanda_alta';
    if (clientesEsperados > barberosRecomendados) return 'overbooking';
    if (barberosRecomendados > 3 && clientesEsperados < barberosRecomendados * 0.4) return 'sobrecapacidad';
    return 'ok';
  }

  /**
   * Clasifica el estado de una franja comparando la demanda contra la capacidad
   * real programada (slots existentes), no contra la propia recomendación.
   * @param {Number} gap                — barberosRecomendados - capacidadProgramada
   * @param {Number} clientesEsperados
   * @param {Number} capacidadProgramada — barberos distintos con slot en esa franja
   * @param {Number} ocupacion           — ratio histórico 0 a 1
   * @returns {'ok'|'demanda_alta'|'overbooking'|'sobrecapacidad'}
   */
  /**
   * Guard de demanda mínima: evita falsos "agrega barbero" en franjas donde
   * casi nadie va (<0.5 clientes esperados). En esas franjas el gap real es 0
   * independientemente de cuántos barberos haya programados.
   * @param {Number} barberosRecomendados
   * @param {Number} capacidadProgramada
   * @param {Number} clientesEsperados
   * @returns {Number} 0 si franja muerta, barberosRecomendados-capacidadProgramada si no
   */
  static calcularGap(barberosRecomendados, capacidadProgramada, clientesEsperados) {
    if (clientesEsperados < 0.5) return 0;
    return barberosRecomendados - capacidadProgramada;
  }

  static detectarAlertaConCapacidad(gap, clientesEsperados, capacidadProgramada, ocupacion) {
    if (gap > 0) return 'overbooking';
    if (gap < 0 && clientesEsperados < capacidadProgramada * 0.5) return 'sobrecapacidad';
    if (ocupacion > 0.85 && gap === 0) return 'demanda_alta';
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
