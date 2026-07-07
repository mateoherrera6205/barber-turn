/**
 * fechas.js
 * Utilidades de fecha para BarberTurn: normalización UTC, próxima ocurrencia
 * de un día de semana y formateo en español para la UI de predicciones.
 *
 * Los números de día siguen la convención del sistema (1=Lun … 6=Sáb),
 * que coincide con JS getDay() para Lunes–Sábado (JS: 0=Dom, 1=Lun … 6=Sáb).
 */

/**
 * normalizarFecha
 * Normaliza una fecha a las 05:00:00 UTC — convención del sistema (seed, BookingPage).
 * Úsala en métodos de servidor y hooks antes de comparar o almacenar fechas de slot.
 * @param {Date} date
 * @returns {Date} nueva instancia con UTC 05:00:00.000
 */
export const normalizarFecha = (date) => {
  const d = new Date(date);
  d.setUTCHours(5, 0, 0, 0);
  return d;
};

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
