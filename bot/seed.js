import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Slots } from '/imports/api/slots/slots';
import { Appointments } from '/imports/api/appointments/appointments';

const CLIENTES = [
  { email: 'juan@test.com',    name: 'Juan Pérez',     phone: '0991111111',
    patron: { diasFavoritos: [5,6],    horasFavoritas: ['09:00','10:00'], frecuencia: 0.8 }},
  { email: 'maria@test.com',   name: 'María García',   phone: '0992222222',
    patron: { diasFavoritos: [3,4],    horasFavoritas: ['14:00','15:00'], frecuencia: 0.6 }},
  { email: 'andres@test.com',  name: 'Andrés Torres',  phone: '0993333333',
    patron: { diasFavoritos: [1,2],    horasFavoritas: ['11:00','12:00'], frecuencia: 0.4 }},
  { email: 'sofia@test.com',   name: 'Sofía Ruiz',     phone: '0994444444',
    patron: { diasFavoritos: [5,6],    horasFavoritas: ['16:00','17:00'], frecuencia: 0.75 }},
  { email: 'diego@test.com',   name: 'Diego Castro',   phone: '0995555555',
    patron: { diasFavoritos: [4,5],    horasFavoritas: ['10:00','11:00'], frecuencia: 0.65 }},
  { email: 'lucia@test.com',   name: 'Lucía Mora',     phone: '0996666666',
    patron: { diasFavoritos: [2,3],    horasFavoritas: ['09:00','14:00'], frecuencia: 0.5 }},
  { email: 'carlosc@test.com', name: 'Carlos Vega',    phone: '0997777777',
    patron: { diasFavoritos: [6],      horasFavoritas: ['10:00','11:00','12:00'], frecuencia: 0.9 }},
  { email: 'ana@test.com',     name: 'Ana Flores',     phone: '0998888888',
    patron: { diasFavoritos: [1,3,5],  horasFavoritas: ['15:00','16:00'], frecuencia: 0.55 }},
];

const BARBEROS = [
  { email: 'carlos@barberturn.com', name: 'Carlos Mendoza',
    horario: { dias: [1,2,3,4,5,6], horas: ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'] }},
  { email: 'luis@barberturn.com',   name: 'Luis Paredes',
    horario: { dias: [1,2,3,4,5],   horas: ['09:00','10:00','11:00','14:00','15:00','16:00'] }},
  { email: 'pedro@barberturn.com',  name: 'Pedro Vásquez',
    horario: { dias: [3,4,5,6],     horas: ['10:00','11:00','12:00','15:00','16:00','17:00'] }},
];

const DEMANDA_DIA = { 1:0.25, 2:0.35, 3:0.55, 4:0.60, 5:0.85, 6:0.90 };

const fechaUTC5 = (date) => {
  const d = new Date(date);
  d.setUTCHours(5, 0, 0, 0);
  return d;
};

const calcProb = (cliente, diaSemana, hora) => {
  const { diasFavoritos, horasFavoritas, frecuencia } = cliente.patron;
  const esDiaFav  = diasFavoritos.includes(diaSemana)  ? 1.3 : 0.7;
  const esHoraFav = horasFavoritas.includes(hora)       ? 1.4 : 0.6;
  const demandaBase = DEMANDA_DIA[diaSemana] || 0.5;
  const ruido = 0.85 + Math.random() * 0.3;
  return Math.min(frecuencia * esDiaFav * esHoraFav * demandaBase * ruido, 1);
};

const decidirStatus = (prob) => {
  if (Math.random() > prob) return null;
  const r = Math.random();
  if (r < 0.75) return 'confirmed';
  if (r < 0.90) return 'cancelled';
  return 'pending';
};

export const runSeed = async () => {
  console.log('🌱 Iniciando seed con comportamiento aleatorio realista...');

  // 1. Crear barberos
  const barberoIds = [];
  for (const b of BARBEROS) {
    let userId = (await Meteor.users.findOneAsync({ 'emails.address': b.email }))?._id;
    if (!userId) {
      userId = await Accounts.createUser({
        email: b.email, password: '123456',
        profile: { name: b.name, role: 'barbero' }
      });
      console.log(`💈 Barbero creado: ${b.name}`);
    }
    barberoIds.push({ userId, ...b });
  }

  // 2. Crear clientes
  const clienteIds = [];
  for (const c of CLIENTES) {
    let userId = (await Meteor.users.findOneAsync({ 'emails.address': c.email }))?._id;
    if (!userId) {
      userId = await Accounts.createUser({
        email: c.email, password: '123456',
        profile: { name: c.name, role: 'cliente', phone: c.phone }
      });
    }
    clienteIds.push({ userId, ...c });
  }

  // 3. Generar 8 semanas de histórico
  const hoy = new Date();
  let totalSlots = 0, totalReservas = 0, totalCancelados = 0;

  for (let semana = 8; semana >= 1; semana--) {
    for (let offsetDia = 0; offsetDia < 7; offsetDia++) {

      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - (semana * 7) + offsetDia);
      const diaSemana = fecha.getDay();
      if (diaSemana === 0) continue;

      const fechaDB = fechaUTC5(fecha);

      for (const barbero of barberoIds) {
        if (!barbero.horario.dias.includes(diaSemana)) continue;
        if (Math.random() < 0.05) continue;

        for (const hora of barbero.horario.horas) {
          if (Math.random() < 0.10) continue;

          const existe = await Slots.findOneAsync({
            barberId: barbero.userId, date: fechaDB, hour: hora
          });
          if (existe) continue;

          const slotId = await Slots.insertAsync({
            barberId: barbero.userId,
            date: fechaDB, hour: hora,
            isAvailable: true, appointmentId: null,
            createdAt: fecha,
          });
          totalSlots++;

          const clientesMezclados = [...clienteIds].sort(() => Math.random() - 0.5);
          let slotOcupado = false;

          for (const cliente of clientesMezclados) {
            if (slotOcupado) break;
            const prob = calcProb(cliente, diaSemana, hora);
            const status = decidirStatus(prob);

            if (status) {
              const appointmentId = await Appointments.insertAsync({
                slotId, clientName: cliente.name, clientPhone: cliente.phone,
                barberId: barbero.userId, date: fechaDB, hour: hora,
                status, createdAt: fecha,
              });
              await Slots.updateAsync(slotId, {
                $set: { isAvailable: false, appointmentId }
              });
              if (status === 'confirmed') totalReservas++;
              if (status === 'cancelled') totalCancelados++;
              slotOcupado = true;
            }
          }
        }
      }
    }
  }

  console.log(`✅ Seed completado:`);
  console.log(`   📅 Slots:       ${totalSlots}`);
  console.log(`   ✅ Confirmados: ${totalReservas}`);
  console.log(`   ❌ Cancelados:  ${totalCancelados}`);
  console.log(`   📊 Ocupación:   ${((totalReservas/totalSlots)*100).toFixed(1)}%`);
};
