/**
 * fechas.js
 * Utilidades de fecha para BarberTurn: calcula la próxima ocurrencia de un
 * día de semana y formatea fechas en español para la UI de predicciones.
 *
 * Los números de día siguen la convención del sistema (1=Lun … 6=Sáb),
 * que coincide con JS getDay() para Lunes–Sábado (JS: 0=Dom, 1=Lun … 6=Sáb).
 */

/**
 * proximaFecha
 * Retorna el Date de la próxima ocurrencia del día indicado (hoy inclusive).
 * @param {number} diaSemana — 1 (Lunes) … 6 (Sábado)
 * @returns {Date}
 */
export const proximaFecha = (diaSemana) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const candidato = new Date(hoy);
    candidato.setDate(hoy.getDate() + i);
    if (candidato.getDay() === diaSemana) return candidato;
  }
  return hoy;
};

/**
 * formatoCorto
 * Retorna una cadena como "13 jul".
 * @param {Date} date
 * @returns {string}
 */
export const formatoCorto = (date) =>
  date.toLocaleDateString('es', { day: 'numeric', month: 'short' });

/**
 * formatoLargo
 * Retorna una cadena como "13 de julio" o "lunes 13 de julio" si conDia=true.
 * @param {Date}    date
 * @param {boolean} conDia — incluir nombre del día (default false)
 * @returns {string}
 */
export const formatoLargo = (date, conDia = false) => {
  const opts = conDia
    ? { weekday: 'long', day: 'numeric', month: 'long' }
    : { day: 'numeric', month: 'long' };
  return date.toLocaleDateString('es', opts);
};
