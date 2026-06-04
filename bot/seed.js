/**
 * bot/seed.js
 * Script de simulación de datos históricos realistas para BarberTurn.
 * Genera 8 semanas de turnos y reservas simulando el comportamiento real de
 * clientes y barberos, con patrones de demanda variables según día y hora.
 *
 * El algoritmo simula:
 *  - 3 barberos con horarios distintos (algunos trabajan menos días u horas)
 *  - 8 clientes con preferencias de días y horas, y frecuencias de visita distintas
 *  - Variabilidad aleatoria en la demanda por día de la semana
 *  - Ruido aleatorio para simular comportamiento humano impredecible
 *  - Estados realistas: 75% confirmed, 15% cancelled, 10% pending
 *
 * Este script es ejecutado en server/main.js cuando la BD tiene menos de 50 appointments.
 */
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Slots } from '/imports/api/slots/slots';
import { Appointments } from '/imports/api/appointments/appointments';

/**
 * CLIENTES
 * Datos de los 8 clientes simulados, cada uno con un patrón de comportamiento:
 *  - diasFavoritos:  días de la semana que prefiere (1=Lun... 6=Sáb)
 *  - horasFavoritas: franjas horarias que prefiere
 *  - frecuencia:     probabilidad base de que el cliente reserve (0 a 1)
 *
 * El patrón define cómo el algoritmo calcProb() ajusta la probabilidad de reserva.
 */
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

/**
 * BARBEROS
 * Datos de los 3 barberos simulados, cada uno con un horario de trabajo:
 *  - dias:  días laborables (1=Lun... 6=Sáb)
 *  - horas: franjas horarias en las que trabaja
 *
 * Carlos trabaja todos los días, Luis de lunes a viernes, Pedro miércoles a sábado.
 */
const BARBEROS = [
  { email: 'carlos@barberturn.com', name: 'Carlos Mendoza',
    horario: { dias: [1,2,3,4,5,6], horas: ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'] }},
  { email: 'luis@barberturn.com',   name: 'Luis Paredes',
    horario: { dias: [1,2,3,4,5],   horas: ['09:00','10:00','11:00','14:00','15:00','16:00'] }},
  { email: 'pedro@barberturn.com',  name: 'Pedro Vásquez',
    horario: { dias: [3,4,5,6],     horas: ['10:00','11:00','12:00','15:00','16:00','17:00'] }},
];

/**
 * DEMANDA_DIA
 * Factor multiplicador de demanda base por día de semana.
 * Refleja la tendencia real en barberías: los fines de semana tienen más demanda.
 *  - Lunes (1): 25% → día de menor demanda
 *  - Sábado (6): 90% → día de máxima demanda
 */
const DEMANDA_DIA = { 1:0.25, 2:0.35, 3:0.55, 4:0.60, 5:0.85, 6:0.90 };

/**
 * fechaUTC5
 * Normaliza una fecha a las 05:00:00.000 UTC, que equivale a medianoche (00:00)
 * en la zona horaria UTC-5 (Ecuador). Esto garantiza que las fechas almacenadas
 * en la BD sean comparables entre sí sin problemas de zona horaria.
 *
 * @param {Date} date - Fecha a normalizar
 * @returns {Date} Nueva fecha con hora establecida a 05:00 UTC
 */
const fechaUTC5 = (date) => {
  const d = new Date(date);
  d.setUTCHours(5, 0, 0, 0);
  return d;
};

/**
 * calcProb
 * Calcula la probabilidad de que un cliente específico reserve un slot
 * en un día y hora determinados. Combina múltiples factores:
 *
 * Factores que aumentan o reducen la probabilidad:
 *  1. esDiaFav:    si el día está en los diasFavoritos del cliente → ×1.3, si no → ×0.7
 *  2. esHoraFav:   si la hora está en horasFavoritas → ×1.4, si no → ×0.6
 *  3. demandaBase: factor de demanda del día (DEMANDA_DIA) para simular más reservas en fin de semana
 *  4. ruido:       valor aleatorio entre 0.85 y 1.15 para simular variabilidad humana
 *
 * La fórmula final: min(frecuencia × esDiaFav × esHoraFav × demandaBase × ruido, 1)
 * Se aplica min(…, 1) para que la probabilidad nunca supere 100%.
 *
 * @param {Object} cliente   - Objeto cliente con su campo 'patron'
 * @param {Number} diaSemana - Día de semana (1=Lun... 6=Sáb)
 * @param {String} hora      - Hora en formato 'HH:MM'
 * @returns {Number} Probabilidad de reserva entre 0 y 1
 */
const calcProb = (cliente, diaSemana, hora) => {
  const { diasFavoritos, horasFavoritas, frecuencia } = cliente.patron;

  // Multiplicador por preferencia de día: si es día favorito se amplifica la probabilidad
  const esDiaFav  = diasFavoritos.includes(diaSemana)  ? 1.3 : 0.7;

  // Multiplicador por preferencia de hora: si es hora favorita se amplifica la probabilidad
  const esHoraFav = horasFavoritas.includes(hora)       ? 1.4 : 0.6;

  // Factor de demanda del día de semana (simulación de comportamiento real de barbería)
  const demandaBase = DEMANDA_DIA[diaSemana] || 0.5;

  // Ruido aleatorio entre 0.85 y 1.15 para simular la variabilidad humana impredecible
  const ruido = 0.85 + Math.random() * 0.3;

  // Probabilidad final como producto de todos los factores, acotada a [0, 1]
  return Math.min(frecuencia * esDiaFav * esHoraFav * demandaBase * ruido, 1);
};

/**
 * decidirStatus
 * Determina el estado final de una reserva (o si no se reserva) basándose
 * en la probabilidad calculada por calcProb y un generador de números aleatorios.
 *
 * Lógica:
 *  - Si Math.random() > prob → el cliente no reserva (retorna null)
 *  - Si reserva (Math.random() ≤ prob), se decide el estado:
 *      · 75% de probabilidad → 'confirmed' (la mayoría se confirman)
 *      · 15% de probabilidad → 'cancelled' (algunos se cancelan)
 *      · 10% de probabilidad → 'pending'   (minoría queda pendiente)
 *
 * @param {Number} prob - Probabilidad de reserva entre 0 y 1
 * @returns {String|null} Estado del turno: 'confirmed' | 'cancelled' | 'pending' | null
 */
const decidirStatus = (prob) => {
  // Si el número aleatorio supera la probabilidad, el cliente no reserva
  if (Math.random() > prob) return null;

  // Decidir el estado de la reserva según distribución probabilística
  const r = Math.random();
  if (r < 0.75) return 'confirmed';   // 75%: reserva confirmada
  if (r < 0.90) return 'cancelled';   // 15%: reserva cancelada (0.75 a 0.90)
  return 'pending';                    // 10%: reserva pendiente (0.90 a 1.00)
};

/**
 * runSeed
 * Función principal del seed que ejecuta todo el proceso de generación de datos.
 * Se llama desde server/main.js si la BD tiene menos de 50 appointments.
 *
 * Flujo de ejecución:
 *  1. Crear o recuperar los usuarios de los 3 barberos
 *  2. Crear o recuperar los usuarios de los 8 clientes
 *  3. Generar 8 semanas de historial (desde hace 8 semanas hasta hoy)
 *     Para cada día laborable de cada semana:
 *       a. Para cada barbero que trabaja ese día (con 5% de probabilidad de falta)
 *         b. Para cada hora del barbero (con 10% de probabilidad de slot vacío):
 *           - Crear el slot si no existe
 *           - Mezclar aleatoriamente los clientes y probar si alguno reserva
 *           - Si un cliente reserva, crear el appointment y marcar el slot como ocupado
 *           - Solo un cliente puede ocupar cada slot (slotOcupado = true)
 *
 * @returns {void} Imprime estadísticas finales en consola
 */
export const runSeed = async () => {
  console.log('🌱 Iniciando seed con comportamiento aleatorio realista...');

  // --- PASO 1: Crear los barberos ---
  // Se crea el usuario si no existe (para poder ejecutar el seed múltiples veces)
  const barberoIds = [];
  for (const b of BARBEROS) {
    // Buscar si ya existe un usuario con este email
    let userId = (await Meteor.users.findOneAsync({ 'emails.address': b.email }))?._id;
    if (!userId) {
      // Crear el usuario barbero con rol 'barbero' en su perfil
      userId = await Accounts.createUser({
        email: b.email, password: '123456',
        profile: { name: b.name, role: 'barbero' }
      });
      console.log(`💈 Barbero creado: ${b.name}`);
    }
    // Almacenar el userId junto con los datos del barbero para uso posterior
    barberoIds.push({ userId, ...b });
  }

  // --- PASO 2: Crear los clientes ---
  // Similar a los barberos: crear si no existen, reutilizar si ya existen
  const clienteIds = [];
  for (const c of CLIENTES) {
    let userId = (await Meteor.users.findOneAsync({ 'emails.address': c.email }))?._id;
    if (!userId) {
      userId = await Accounts.createUser({
        email: c.email, password: '123456',
        profile: { name: c.name, role: 'cliente', phone: c.phone }
      });
    }
    // Almacenar el userId junto con los datos del cliente (incluye el patrón de comportamiento)
    clienteIds.push({ userId, ...c });
  }

  // --- PASO 3: Generar 8 semanas de histórico ---
  const hoy = new Date();
  let totalSlots = 0, totalReservas = 0, totalCancelados = 0;

  // Iterar desde la semana más antigua (semana 8) hasta la más reciente (semana 1)
  for (let semana = 8; semana >= 1; semana--) {
    // Iterar los 7 días de cada semana
    for (let offsetDia = 0; offsetDia < 7; offsetDia++) {

      // Calcular la fecha exacta: (semanas atrás × 7 días) + offset del día
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - (semana * 7) + offsetDia);

      // getDay() retorna 0=Domingo, 1=Lunes... 6=Sábado
      const diaSemana = fecha.getDay();

      // Omitir domingos ya que la barbería no trabaja ese día
      if (diaSemana === 0) continue;

      // Normalizar la fecha a UTC-5 medianoche para consistencia en la BD
      const fechaDB = fechaUTC5(fecha);

      // Iterar sobre cada barbero para generar sus slots del día
      for (const barbero of barberoIds) {
        // Saltar si este barbero no trabaja este día de la semana
        if (!barbero.horario.dias.includes(diaSemana)) continue;

        // Simular ausencias esporádicas del barbero: 5% de probabilidad de falta
        if (Math.random() < 0.05) continue;

        // Iterar sobre cada hora del horario del barbero
        for (const hora of barbero.horario.horas) {
          // Simular slots que no se crean por imprevisto: 10% de probabilidad
          if (Math.random() < 0.10) continue;

          // Verificar si el slot ya fue creado en una ejecución anterior del seed
          const existe = await Slots.findOneAsync({
            barberId: barbero.userId, date: fechaDB, hour: hora
          });
          if (existe) continue;

          // Crear el slot disponible para este barbero, fecha y hora
          const slotId = await Slots.insertAsync({
            barberId: barbero.userId,
            date: fechaDB, hour: hora,
            isAvailable: true, appointmentId: null,
            createdAt: fecha,
          });
          totalSlots++;

          // --- SIMULACIÓN DE RESERVAS ---
          // Mezclar aleatoriamente el orden de los clientes para simular quién llega primero
          const clientesMezclados = [...clienteIds].sort(() => Math.random() - 0.5);
          let slotOcupado = false;

          // Probar cada cliente en orden aleatorio hasta que uno reserve o se agoten
          for (const cliente of clientesMezclados) {
            // Si el slot ya fue ocupado por un cliente anterior, pasar al siguiente slot
            if (slotOcupado) break;

            // Calcular la probabilidad de que este cliente reserve en este día/hora
            const prob = calcProb(cliente, diaSemana, hora);

            // Decidir si el cliente reserva y con qué estado
            const status = decidirStatus(prob);

            // Si el cliente decide reservar (status no es null)
            if (status) {
              // Crear el appointment para esta reserva simulada
              const appointmentId = await Appointments.insertAsync({
                slotId, clientName: cliente.name, clientPhone: cliente.phone,
                barberId: barbero.userId, date: fechaDB, hour: hora,
                status, createdAt: fecha,
              });

              // Marcar el slot como ocupado con referencia al appointment creado
              await Slots.updateAsync(slotId, {
                $set: { isAvailable: false, appointmentId }
              });

              // Actualizar contadores para las estadísticas finales
              if (status === 'confirmed') totalReservas++;
              if (status === 'cancelled') totalCancelados++;

              // Marcar el slot como ocupado para no asignarlo a otro cliente
              slotOcupado = true;
            }
          }
        }
      }
    }
  }

  // --- ESTADÍSTICAS FINALES ---
  // Imprimir resumen del seed para monitoreo durante el arranque del servidor
  console.log(`✅ Seed completado:`);
  console.log(`   📅 Slots:       ${totalSlots}`);
  console.log(`   ✅ Confirmados: ${totalReservas}`);
  console.log(`   ❌ Cancelados:  ${totalCancelados}`);
  console.log(`   📊 Ocupación:   ${((totalReservas/totalSlots)*100).toFixed(1)}%`);
};
