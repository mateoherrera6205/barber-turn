/**
 * bot/seed.js
 * Script de simulación de datos históricos realistas para BarberTurn.
 * Genera 8 semanas de turnos y reservas simulando el comportamiento real de
 * clientes y barberos, con patrones de demanda variables según día y hora.
 *
 * Desde v2, la mezcla de cancelaciones por día se calibra con el dataset real
 * private/data/Client_Cancellations0.csv. Si el archivo no existe o falla el
 * parseo, el seed cae al comportamiento anterior (valores hardcodeados) con
 * un console.warn y nunca rompe el startup.
 *
 * Clientes:
 *  - 3 cuentas demo con login (juan/maria/sofia @test.com) para BookingPage.
 *  - Hasta 25 códigos del dataset como clientName sin cuenta Meteor.
 *
 * Este script es ejecutado en server/main.js cuando la BD tiene menos de 50 appointments.
 */
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Slots } from '/imports/api/slots/slots';
import { Appointments } from '/imports/api/appointments/appointments';
import { loadDataset } from '/imports/startup/server/cancellationsDataset';

// ─── Fallbacks (se usan si el dataset no se puede cargar) ─────────────────
// Nombres reales del dataset (top 4 por frecuencia: JJ 70, BECKY 61, JOANNE 45, KELLY 44)
const STAFF_DEFAULT = ['JJ', 'BECKY', 'JOANNE', 'KELLY'];
const TASA_CANCEL_DEFAULT = { 1: 0.15, 2: 0.15, 3: 0.15, 4: 0.15, 5: 0.15, 6: 0.15 };

// ─── Horarios: 4 plantillas variadas asignadas por posición de staff ───────
const HORARIOS = [
  // Jornada completa (6 días)
  { dias: [1,2,3,4,5,6], horas: ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'] },
  // Lunes a viernes, turno de mañana/tarde
  { dias: [1,2,3,4,5],   horas: ['09:00','10:00','11:00','14:00','15:00','16:00'] },
  // Miércoles a sábado, turno de tarde
  { dias: [3,4,5,6],     horas: ['10:00','11:00','12:00','15:00','16:00','17:00'] },
  // Martes a sábado, turno reducido
  { dias: [2,3,4,5,6],   horas: ['09:00','10:00','14:00','15:00','16:00'] },
];

// ─── Clientes demo con cuenta Meteor (para login en BookingPage) ───────────
const DEMO_CLIENTES = [
  { email: 'juan@test.com',  name: 'Juan Pérez',   phone: '0991111111',
    patron: { diasFavoritos: [5,6], horasFavoritas: ['09:00','10:00'], frecuencia: 0.8 }},
  { email: 'maria@test.com', name: 'María García', phone: '0992222222',
    patron: { diasFavoritos: [3,4], horasFavoritas: ['14:00','15:00'], frecuencia: 0.6 }},
  { email: 'sofia@test.com', name: 'Sofía Ruiz',   phone: '0994444444',
    patron: { diasFavoritos: [5,6], horasFavoritas: ['16:00','17:00'], frecuencia: 0.75 }},
];

// ─── Patrón de comportamiento determinista por código del dataset ──────────
const DIAS_OPTS  = [[5,6],[1,2],[3,4],[4,5],[2,3,6],[1,3,5],[2,4,6]];
const HORAS_OPTS = [['09:00','10:00'],['11:00','12:00'],['14:00','15:00'],['16:00','17:00'],['10:00','14:00']];

const hashCode = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const patronDesde = (code) => {
  const h = hashCode(code);
  return {
    diasFavoritos:  DIAS_OPTS[h % DIAS_OPTS.length],
    horasFavoritas: HORAS_OPTS[(h >>> 3) % HORAS_OPTS.length],
    frecuencia:     0.30 + (h % 70) / 100, // 0.30–0.99, determinista
  };
};

// ─── Factor de demanda por día ─────────────────────────────────────────────
const DEMANDA_DIA = { 1: 0.25, 2: 0.35, 3: 0.55, 4: 0.60, 5: 0.85, 6: 0.90 };

const fechaUTC5 = (date) => {
  const d = new Date(date);
  d.setUTCHours(5, 0, 0, 0);
  return d;
};

const calcProb = (cliente, diaSemana, hora) => {
  const { diasFavoritos, horasFavoritas, frecuencia } = cliente.patron;
  const esDiaFav   = diasFavoritos.includes(diaSemana) ? 1.3 : 0.7;
  const esHoraFav  = horasFavoritas.includes(hora)      ? 1.4 : 0.6;
  const demandaBase = DEMANDA_DIA[diaSemana] || 0.5;
  const ruido       = 0.85 + Math.random() * 0.3;
  return Math.min(frecuencia * esDiaFav * esHoraFav * demandaBase * ruido, 1);
};

/**
 * decidirStatus
 * La probabilidad de cancelación ya no es fija: usa tasaCancelacionPorDia del
 * dataset (vs. 15% fijo anterior). El 10% pending se mantiene constante.
 *
 * @param {Number} prob
 * @param {Number} diaSemana
 * @param {Object} tasaCancelPorDia
 * @returns {'confirmed'|'cancelled'|'pending'|null}
 */
const decidirStatus = (prob, diaSemana, tasaCancelPorDia) => {
  if (Math.random() > prob) return null;
  const tasaCancel = tasaCancelPorDia[diaSemana] ?? 0.15;
  const r = Math.random();
  if (r < 1 - tasaCancel - 0.10) return 'confirmed';
  if (r < 1 - 0.10)              return 'cancelled';
  return 'pending';
};

/**
 * runSeed
 * Función principal del seed. Se llama desde server/main.js si la BD tiene
 * menos de 50 appointments.
 */
export const runSeed = async () => {
  console.log('🌱 Iniciando seed calibrado con dataset real de cancelaciones...');

  // ─── Cargar dataset (con fallback si el archivo no existe) ────────────────
  let dataset = null;
  try {
    dataset = await loadDataset();
    console.log(`📊 Dataset cargado: ${dataset.staff.length} staff, ${dataset.clientes.length} clientes`);
  } catch (err) {
    console.warn('⚠️  No se pudo cargar el dataset de cancelaciones; usando valores por defecto.', err.message);
  }

  // ─── Barberos: 4 staff del dataset (o fallback hardcodeado) ───────────────
  const top4Staff = (dataset?.staff || STAFF_DEFAULT).slice(0, 4);
  const BARBEROS  = top4Staff.map((name, i) => ({
    email:   `${name.toLowerCase()}@barberturn.com`,
    name,
    horario: HORARIOS[i],
  }));

  // ─── Clientes del dataset: top 25 sin cuenta Meteor ───────────────────────
  const codesDataset   = dataset?.clientes || [];
  const DATASET_CLIENTES = codesDataset.slice(0, 25).map((c, i) => ({
    name:   `Cliente ${c.code}`,
    phone:  `0991${String(100 + i).padStart(6, '0')}`,
    patron: patronDesde(c.code),
  }));

  const tasaCancelacionPorDia = dataset?.tasaCancelacionPorDia || TASA_CANCEL_DEFAULT;

  // ─── PASO 1: Crear barberos ───────────────────────────────────────────────
  const barberoIds = [];
  for (const b of BARBEROS) {
    let userId = (await Meteor.users.findOneAsync({ 'emails.address': b.email }))?._id;
    if (!userId) {
      userId = await Accounts.createUser({
        email: b.email, password: '123456',
        profile: { name: b.name, role: 'barbero' },
      });
      console.log(`💈 Barbero creado: ${b.name}`);
    }
    barberoIds.push({ userId, ...b });
  }

  // ─── PASO 2: Crear clientes demo + cargar clientes del dataset ────────────
  const clienteIds = [];

  // 3 cuentas demo con login (para BookingPage)
  for (const c of DEMO_CLIENTES) {
    let userId = (await Meteor.users.findOneAsync({ 'emails.address': c.email }))?._id;
    if (!userId) {
      userId = await Accounts.createUser({
        email: c.email, password: '123456',
        profile: { name: c.name, role: 'cliente', phone: c.phone },
      });
    }
    clienteIds.push({ userId, ...c });
  }

  // Hasta 25 clientes del dataset (solo nombre y patrón; sin cuenta Meteor)
  for (const c of DATASET_CLIENTES) {
    clienteIds.push(c);
  }

  // ─── PASO 3: Generar 8 semanas de histórico ───────────────────────────────
  const hoy = new Date();
  let totalSlots = 0, totalReservas = 0, totalCancelados = 0;

  for (let semana = 8; semana >= 1; semana--) {
    for (let offsetDia = 0; offsetDia < 7; offsetDia++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - (semana * 7) + offsetDia);
      const diaSemana = fecha.getDay();
      if (diaSemana === 0) continue; // Sin domingos

      const fechaDB = fechaUTC5(fecha);

      for (const barbero of barberoIds) {
        if (!barbero.horario.dias.includes(diaSemana)) continue;
        if (Math.random() < 0.05) continue; // 5% ausencia esporádica

        for (const hora of barbero.horario.horas) {
          if (Math.random() < 0.10) continue; // 10% slot no creado

          const existe = await Slots.findOneAsync({
            barberId: barbero.userId, date: fechaDB, hour: hora,
          });
          if (existe) continue;

          const slotId = await Slots.insertAsync({
            barberId: barbero.userId,
            date: fechaDB, hour: hora,
            isAvailable: true, appointmentId: null,
            createdAt: fecha,
          });
          totalSlots++;

          // Muestra aleatoria de 5 clientes por slot (vs. probar los ~28)
          // Baja el llenado de ~99% a ~76%, más realista y permite que
          // 'sobrecapacidad'/'reducir' aparezcan con naturalidad.
          const mezclados = [...clienteIds].sort(() => Math.random() - 0.5).slice(0, 5);
          let slotOcupado = false;

          for (const cliente of mezclados) {
            if (slotOcupado) break;
            const prob   = calcProb(cliente, diaSemana, hora);
            const status = decidirStatus(prob, diaSemana, tasaCancelacionPorDia);
            if (status) {
              const appointmentId = await Appointments.insertAsync({
                slotId,
                clientName: cliente.name, clientPhone: cliente.phone,
                barberId: barbero.userId, date: fechaDB, hour: hora,
                status, createdAt: fecha,
              });
              await Slots.updateAsync(slotId, { $set: { isAvailable: false, appointmentId } });
              if (status === 'confirmed') totalReservas++;
              if (status === 'cancelled') totalCancelados++;
              slotOcupado = true;
            }
          }
        }
      }
    }
  }

  // ─── ESTADÍSTICAS FINALES ─────────────────────────────────────────────────
  const ocupacion = totalSlots > 0 ? ((totalReservas / totalSlots) * 100).toFixed(1) : '0.0';
  console.log('✅ Seed completado:');
  console.log(`   📅 Slots:       ${totalSlots}`);
  console.log(`   ✅ Confirmados: ${totalReservas}`);
  console.log(`   ❌ Cancelados:  ${totalCancelados}`);
  console.log(`   📊 Ocupación:   ${ocupacion}%`);
  if (dataset) {
    console.log('   📋 Parámetros del dataset usados:');
    console.log(`      Staff (top 4):   ${top4Staff.join(', ')}`);
    console.log(`      Tasa cancel/día: ${JSON.stringify(tasaCancelacionPorDia)}`);
    console.log(`      Anticipación:    ${JSON.stringify(dataset.distAnticipacion)}`);
  }
};
