/**
 * cancellationsDataset.js — server only
 * Lee y parsea el dataset de cancelaciones reales desde private/data/.
 *
 * FUENTE: Dataset de cancelaciones de un salón/barbería, año 2018.
 *   Archivo: Client_Cancellations0.csv (o "Client Cancellations0.csv")
 *   Columnas: Cancel Date, Code, Service, Staff, Booking Date, Canceled By, Days
 *   ~243 filas, fechas MM/DD/YYYY.
 *
 * LIMITACIONES:
 *  - Sin horas de cita: solo calibra la distribución de cancelaciones por día
 *    de semana y el perfil del staff. Las franjas horarias del seed siguen
 *    siendo simuladas.
 *  - Tasas de cancelación son proporciones del historial 2018; pueden diferir
 *    del negocio que ejecuta la aplicación.
 *  - "Days" es anticipación de cancelación (Booking Date - Cancel Date), no
 *    la duración del servicio.
 *
 * Assets es un global del servidor en Meteor; no requiere import explícito.
 */

/**
 * Parsea una cadena MM/DD/YYYY a Date. Retorna null si el formato es inválido.
 */
const parseMMDDYYYY = (dateStr) => {
  const parts = (dateStr || '').trim().split('/');
  if (parts.length !== 3) return null;
  const d = new Date(parseInt(parts[2], 10), parseInt(parts[0], 10) - 1, parseInt(parts[1], 10));
  return isNaN(d.getTime()) ? null : d;
};

/**
 * loadDataset
 * Lee el CSV, descarta filas inválidas (Days negativo, campos vacíos) y
 * devuelve los parámetros necesarios para calibrar el seed.
 *
 * @returns {{ staff, clientes, tasaCancelacionPorDia, distAnticipacion }}
 */
export const loadDataset = async () => {
  // Intentar con underscore (nombre spec) y luego con espacio (nombre en disco)
  let text;
  try {
    text = await Assets.getTextAsync('data/Client_Cancellations0.csv');
  } catch {
    text = await Assets.getTextAsync('data/Client Cancellations0.csv');
  }

  // Parseo línea a línea; el archivo no tiene comas embebidas
  const lines = text.trim().split('\n');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 7) continue;
    const [cancelDate, code, , staff, bookingDate, , daysStr] = parts;
    if (!code?.trim() || !staff?.trim() || !bookingDate?.trim()) continue;
    const days = parseInt(daysStr?.trim(), 10);
    if (isNaN(days) || days < 0) continue;
    rows.push({ code: code.trim(), staff: staff.trim(), bookingDate: bookingDate.trim(), days });
  }

  if (rows.length === 0) throw new Error('CSV vacío o sin filas válidas');

  // Staff únicos ordenados por frecuencia descendente
  const staffCount = {};
  for (const r of rows) {
    staffCount[r.staff] = (staffCount[r.staff] || 0) + 1;
  }
  const staff = Object.entries(staffCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  // Top 25 códigos de cliente por frecuencia
  const codeCount = {};
  for (const r of rows) {
    codeCount[r.code] = (codeCount[r.code] || 0) + 1;
  }
  const clientes = Object.entries(codeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([code, cancelaciones]) => ({ code, cancelaciones }));

  // Tasa de cancelación por día de semana (Booking Date = día para el que se reservó)
  // Proporción de cancelaciones por cada día 1=Lun..6=Sáb, normalizada a promedio=0.18
  const dayCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  let totalMonSat = 0;
  for (const r of rows) {
    const d = parseMMDDYYYY(r.bookingDate);
    if (!d) continue;
    const day = d.getDay(); // 0=Dom, 1=Lun..6=Sáb
    if (day === 0) continue;
    dayCounts[day]++;
    totalMonSat++;
  }

  const rawRates = {};
  for (let d = 1; d <= 6; d++) {
    rawRates[d] = totalMonSat > 0 ? dayCounts[d] / totalMonSat : 1 / 6;
  }
  const avgRaw = Object.values(rawRates).reduce((s, v) => s + v, 0) / 6;
  const normFactor = avgRaw > 0 ? 0.18 / avgRaw : 1;
  const tasaCancelacionPorDia = {};
  for (let d = 1; d <= 6; d++) {
    tasaCancelacionPorDia[d] = parseFloat((rawRates[d] * normFactor).toFixed(4));
  }

  // Distribución de anticipación de cancelación
  let mismodia = 0, corta = 0, larga = 0;
  for (const r of rows) {
    if (r.days === 0)     mismodia++;
    else if (r.days <= 2) corta++;
    else                  larga++;
  }
  const distAnticipacion = {
    mismodia: parseFloat((mismodia / rows.length).toFixed(4)),
    corta:    parseFloat((corta    / rows.length).toFixed(4)),
    larga:    parseFloat((larga    / rows.length).toFixed(4)),
  };

  return { staff, clientes, tasaCancelacionPorDia, distAnticipacion };
};
