import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { StaffingPlan } from '/imports/api/predictions/staffingPlan';

export function useStaffingPlan() {
  return useTracker(() => {
    const handle = Meteor.subscribe('staffingPlan.all');
    if (!handle.ready()) return { isLoading: true, acciones: [], accionesPorDia: {} };

    const acciones = StaffingPlan.find({}, { sort: { diaSemana: 1, prioridad: 1 } }).fetch();

    // Agrupar por diaSemana; cada grupo ya viene ordenado por prioridad del sort
    const accionesPorDia = {};
    for (const accion of acciones) {
      if (!accionesPorDia[accion.diaSemana]) accionesPorDia[accion.diaSemana] = [];
      accionesPorDia[accion.diaSemana].push(accion);
    }

    return { isLoading: false, acciones, accionesPorDia };
  });
}
