/**
 * usePlanner.js
 * Hook para el planificador semanal de turnos.
 * Se suscribe a 'planner.week' (slots+barberos próximos 7 días) y a
 * 'predictions.all' (para saber cuántos barberos se necesitan por franja).
 *
 * @returns {{ isLoading, dias, barberos }}
 *   - dias:     próximos 7 días excluyendo domingo, cada uno con { fecha, diaSemana,
 *               etiqueta, celdas } donde celdas es un objeto por hora con
 *               { asignados, necesarios, clientesEsperados }
 *   - barberos: [{_id, nombre}] todos los barberos publicados
 */
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Slots } from '/imports/api/slots/slots';
import { Predictions } from '/imports/api/predictions/predictions';
import { normalizarFecha, formatoCorto } from '/imports/utils/fechas';

const HORAS = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];

const DIAS_CORTOS = { 0:'Dom', 1:'Lun', 2:'Mar', 3:'Mié', 4:'Jue', 5:'Vie', 6:'Sáb' };

// Compara si dos fechas caen en el mismo día UTC (tolerante a offsets UTC 0h–5h)
const mismaFechaUTC = (a, b) =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth()    === b.getUTCMonth()    &&
  a.getUTCDate()     === b.getUTCDate();

export function usePlanner() {
  return useTracker(() => {
    const hPlanner = Meteor.subscribe('planner.week');
    const hPreds   = Meteor.subscribe('predictions.all');

    if (!hPlanner.ready() || !hPreds.ready()) return { isLoading: true, dias: [], barberos: [] };

    const allSlots      = Slots.find().fetch();
    const predictions   = Predictions.find().fetch();
    const usuariosBarberos = Meteor.users.find({ 'profile.role': 'barbero' }).fetch();

    const barberos = usuariosBarberos.map(u => ({
      _id:    u._id,
      nombre: u.profile?.name || `Barbero ${u._id.slice(0, 6)}`,
    }));

    // Construir los próximos 7 días excluyendo domingo (getDay() === 0)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const dias = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      if (fecha.getDay() === 0) continue; // excluir domingo

      const diaSemana = fecha.getDay(); // 1=Lun … 6=Sáb

      // Celda por hora: qué barberos están asignados y cuántos se necesitan
      const celdas = {};
      for (const hora of HORAS) {
        const asignados = barberos
          .map(b => {
            const slot = allSlots.find(s =>
              s.barberId === b._id &&
              mismaFechaUTC(s.date, fecha) &&
              s.hour === hora
            );
            return slot
              ? { barberId: b._id, nombre: b.nombre, ocupado: !slot.isAvailable, slotId: slot._id }
              : null;
          })
          .filter(Boolean);

        const pred = predictions.find(p => p.diaSemana === diaSemana && p.hora === hora);

        celdas[hora] = {
          asignados,
          necesarios:        pred?.barberosRecomendados ?? 0,
          clientesEsperados: pred?.clientesEsperados    ?? 0,
        };
      }

      dias.push({
        fecha,
        diaSemana,
        etiqueta: `${DIAS_CORTOS[diaSemana]} ${formatoCorto(fecha)}`,
        celdas,
      });
    }

    return { isLoading: false, dias, barberos };
  });
}
