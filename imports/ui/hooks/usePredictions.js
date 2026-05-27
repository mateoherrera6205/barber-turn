import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Predictions } from '/imports/api/predictions/predictions';

const DIAS_NOMBRE = { 1:'Lunes', 2:'Martes', 3:'Miércoles', 4:'Jueves', 5:'Viernes', 6:'Sábado' };

export function usePredictions() {
  return useTracker(() => {
    const handle = Meteor.subscribe('predictions.all');
    if (!handle.ready()) return { isLoading: true, porDia: [] };

    const predictions = Predictions.find({}, { sort: { diaSemana: 1, hora: 1 } }).fetch();

    // Agrupar por día
    const porDia = [1,2,3,4,5,6].map(dia => ({
      dia,
      nombre: DIAS_NOMBRE[dia],
      franjas: predictions.filter(p => p.diaSemana === dia),
      alertas: predictions.filter(p => p.diaSemana === dia && p.alerta !== 'ok').length,
      maxDemanda: Math.max(...predictions.filter(p => p.diaSemana === dia).map(p => p.clientesEsperados), 0),
    }));

    const totalAlertas = predictions.filter(p => p.alerta !== 'ok').length;
    const totalOverbooking = predictions.filter(p => p.alerta === 'overbooking').length;

    return { isLoading: false, porDia, predictions, totalAlertas, totalOverbooking };
  });
}