/**
 * usePredictions.js
 * Hook personalizado de React para acceder a las predicciones de demanda calculadas.
 * Se suscribe a 'predictions.all' y agrupa los datos por día de semana
 * para facilitar la visualización en PredictionPage con tabs por día.
 *
 * Suscripción utilizada: 'predictions.all'
 *  - Requiere usuario autenticado
 *  - Retorna todas las predicciones ordenadas por día y hora
 *
 * Procesamiento que realiza:
 *  - Agrupa las predicciones por día de semana (1=Lun... 6=Sáb)
 *  - Calcula la cantidad de alertas por día y la demanda máxima
 *  - Contabiliza alertas globales y riesgos de overbooking
 *
 * @returns {Object} Objeto con los datos de predicción o { isLoading: true, porDia: [] }:
 *   - isLoading       {Boolean}       true mientras la suscripción carga
 *   - porDia          {Array<Object>} Predicciones agrupadas por día:
 *                                     [{dia, nombre, franjas, alertas, maxDemanda}]
 *   - predictions     {Array<Object>} Lista plana de todas las predicciones
 *   - totalAlertas    {Number}        Total de franjas con alerta != 'ok'
 *   - totalOverbooking{Number}        Total de franjas con alerta === 'overbooking'
 */
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Predictions } from '/imports/api/predictions/predictions';
import { proximaFecha, formatoCorto, formatoLargo } from '/imports/utils/fechas';

// Mapa de número de día a nombre en español para mostrar en la UI
const DIAS_NOMBRE = { 1:'Lunes', 2:'Martes', 3:'Miércoles', 4:'Jueves', 5:'Viernes', 6:'Sábado' };

export function usePredictions() {
  return useTracker(() => {
    // Suscribirse a todas las predicciones del sistema
    const handle = Meteor.subscribe('predictions.all');

    // Retornar estado vacío mientras los datos cargan para evitar renders con datos incompletos
    if (!handle.ready()) return { isLoading: true, porDia: [] };

    // Obtener todas las predicciones del MiniMongo local, ordenadas por día y hora
    const predictions = Predictions.find({}, { sort: { diaSemana: 1, hora: 1 } }).fetch();

    // Agrupar por día
    // Para cada día de la semana (1=Lun a 6=Sáb) crear un objeto con:
    //  - dia:        número del día (1-6)
    //  - nombre:     nombre en español del día
    //  - franjas:    predicciones de ese día (todas las horas)
    //  - alertas:    cantidad de franjas con situación anómala (alerta != 'ok')
    //  - maxDemanda: el pico máximo de clientes esperados en cualquier hora del día
    const porDia = [1,2,3,4,5,6].map(dia => {
      const fecha = proximaFecha(dia);
      return {
        dia,
        nombre: DIAS_NOMBRE[dia],
        fecha,
        fechaCorta: formatoCorto(fecha),
        fechaLarga: formatoLargo(fecha),
        // Filtrar las predicciones de este día
        franjas: predictions.filter(p => p.diaSemana === dia),
        // Contar franjas problemáticas para mostrar el badge de alertas en las tabs
        alertas: predictions.filter(p => p.diaSemana === dia && p.alerta !== 'ok').length,
        // Máxima demanda esperada del día para mostrar el pico en la UI
        maxDemanda: Math.max(...predictions.filter(p => p.diaSemana === dia).map(p => p.clientesEsperados), 0),
      };
    });

    // Contadores globales de alertas para el banner de advertencia en PredictionPage
    const totalAlertas     = predictions.filter(p => p.alerta !== 'ok').length;
    const totalOverbooking = predictions.filter(p => p.alerta === 'overbooking').length;

    return { isLoading: false, porDia, predictions, totalAlertas, totalOverbooking };
  });
}
