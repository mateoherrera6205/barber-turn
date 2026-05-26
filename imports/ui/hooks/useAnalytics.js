import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Appointments } from '/imports/api/appointments/appointments';
import { Slots } from '/imports/api/slots/slots';

export function useAnalytics() {
  return useTracker(() => {
    const handle = Meteor.subscribe('analytics.overview');

    if (!handle.ready()) return { isLoading: true };

    const appointments = Appointments.find().fetch();
    const slots = Slots.find().fetch();

    // Total general
    const totalSlots        = slots.length;
    const totalConfirmados  = appointments.filter(a => a.status === 'confirmed').length;
    const totalCancelados   = appointments.filter(a => a.status === 'cancelled').length;
    const totalPendientes   = appointments.filter(a => a.status === 'pending').length;
    const ocupacion         = totalSlots > 0
      ? ((totalConfirmados / totalSlots) * 100).toFixed(1)
      : 0;

    // Demanda por día de semana
    const diasNombre = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const porDia = Array(7).fill(0).map((_, i) => ({ dia: diasNombre[i], confirmados: 0, cancelados: 0 }));
    appointments.forEach(a => {
      const d = new Date(a.date).getDay();
      if (a.status === 'confirmed') porDia[d].confirmados++;
      if (a.status === 'cancelled') porDia[d].cancelados++;
    });
    const demandaPorDia = porDia.filter((_, i) => i !== 0); // quitar domingo

    // Demanda por hora
    const horas = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];
    const demandaPorHora = horas.map(hora => ({
      hora,
      confirmados: appointments.filter(a => a.hour === hora && a.status === 'confirmed').length,
      cancelados:  appointments.filter(a => a.hour === hora && a.status === 'cancelled').length,
    }));

    // Ocupación por barbero
    const barberos = [...new Set(slots.map(s => s.barberId))];
    const porBarbero = barberos.map(barberId => {
      const slotsB  = slots.filter(s => s.barberId === barberId);
      const apptB   = appointments.filter(a => a.barberId === barberId && a.status === 'confirmed');
      const usuario = Meteor.users.findOne(barberId);
      return {
        barberId,
        nombre:      usuario?.profile?.name || barberId.slice(0, 6),
        totalSlots:  slotsB.length,
        confirmados: apptB.length,
        ocupacion:   slotsB.length > 0 ? ((apptB.length / slotsB.length) * 100).toFixed(1) : 0,
      };
    });

    return {
      isLoading: false,
      totalSlots,
      totalConfirmados,
      totalCancelados,
      totalPendientes,
      ocupacion,
      demandaPorDia,
      demandaPorHora,
      porBarbero,
    };
  });
}
