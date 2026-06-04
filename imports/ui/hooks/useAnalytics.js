/**
 * useAnalytics.js
 * Hook personalizado de React para calcular y exponer las estadísticas de analytics.
 * Se suscribe a 'analytics.overview' que publica appointments y slots completos,
 * luego realiza todos los cálculos de métricas en el cliente usando MiniMongo.
 *
 * Suscripción utilizada: 'analytics.overview'
 *  - Requiere usuario autenticado
 *  - Publica campos mínimos de Appointments y Slots para reducir tráfico de red
 *
 * Cálculos que realiza:
 *  1. Totales globales: slots, confirmados, cancelados, pendientes, ocupación %
 *  2. Demanda por día de semana: conteo de confirmados y cancelados agrupados por día
 *  3. Demanda por hora: conteo por franja horaria del sistema
 *  4. Ocupación por barbero: ratio de confirmados/slots para cada barbero
 *
 * @returns {Object} Objeto con todas las métricas o { isLoading: true } mientras carga:
 *   - isLoading        {Boolean}       true mientras la suscripción carga
 *   - totalSlots       {Number}        Total de slots creados históricamente
 *   - totalConfirmados {Number}        Total de appointments confirmados
 *   - totalCancelados  {Number}        Total de appointments cancelados
 *   - totalPendientes  {Number}        Total de appointments pendientes
 *   - ocupacion        {String}        Porcentaje de ocupación global (ej: "72.3")
 *   - demandaPorDia    {Array<Object>} [{dia, confirmados, cancelados}] de Lun a Sáb
 *   - demandaPorHora   {Array<Object>} [{hora, confirmados, cancelados}] por franja
 *   - porBarbero       {Array<Object>} [{barberId, nombre, totalSlots, confirmados, ocupacion}]
 */
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Appointments } from '/imports/api/appointments/appointments';
import { Slots } from '/imports/api/slots/slots';

export function useAnalytics() {
  return useTracker(() => {
    // Suscribirse a la publicación que trae appointments y slots para analytics
    const handle = Meteor.subscribe('analytics.overview');

    // Retornar estado de carga mientras la suscripción no ha completado
    if (!handle.ready()) return { isLoading: true };

    // Obtener todos los documentos sincronizados en MiniMongo
    const appointments = Appointments.find().fetch();
    const slots = Slots.find().fetch();

    // --- CÁLCULO 1: Totales globales ---
    const totalSlots        = slots.length;
    const totalConfirmados  = appointments.filter(a => a.status === 'confirmed').length;
    const totalCancelados   = appointments.filter(a => a.status === 'cancelled').length;
    const totalPendientes   = appointments.filter(a => a.status === 'pending').length;

    // Ocupación = confirmados / slots totales, expresado como porcentaje con 1 decimal
    const ocupacion         = totalSlots > 0
      ? ((totalConfirmados / totalSlots) * 100).toFixed(1)
      : 0;

    // --- CÁLCULO 2: Demanda por día de semana ---
    // Array de 7 posiciones (0=Dom... 6=Sáb) con contadores inicializados en 0
    const diasNombre = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const porDia = Array(7).fill(0).map((_, i) => ({ dia: diasNombre[i], confirmados: 0, cancelados: 0 }));

    // Incrementar contadores según el día de la semana de cada appointment
    appointments.forEach(a => {
      const d = new Date(a.date).getDay(); // 0=Dom, 1=Lun... 6=Sáb
      if (a.status === 'confirmed') porDia[d].confirmados++;
      if (a.status === 'cancelled') porDia[d].cancelados++;
    });

    // Excluir domingo (índice 0) ya que la barbería no trabaja ese día
    const demandaPorDia = porDia.filter((_, i) => i !== 0);

    // --- CÁLCULO 3: Demanda por hora ---
    // Franjas horarias fijas del sistema (mismas que en SlotGenerator)
    const horas = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];
    const demandaPorHora = horas.map(hora => ({
      hora,
      // Contar appointments de esta hora con estado confirmado
      confirmados: appointments.filter(a => a.hour === hora && a.status === 'confirmed').length,
      // Contar appointments de esta hora con estado cancelado
      cancelados:  appointments.filter(a => a.hour === hora && a.status === 'cancelled').length,
    }));

    // --- CÁLCULO 4: Ocupación por barbero ---
    // Obtener IDs únicos de barberos presentes en los slots
    const barberos = [...new Set(slots.map(s => s.barberId))];

    const porBarbero = barberos.map(barberId => {
      // Filtrar slots y appointments de este barbero específico
      const slotsB  = slots.filter(s => s.barberId === barberId);
      const apptB   = appointments.filter(a => a.barberId === barberId && a.status === 'confirmed');

      // Buscar el nombre del barbero en la colección de usuarios del cliente (MiniMongo)
      const usuario = Meteor.users.findOne(barberId);

      return {
        barberId,
        // Usar el nombre del perfil o los primeros 6 caracteres del ID como fallback
        nombre:      usuario?.profile?.name || barberId.slice(0, 6),
        totalSlots:  slotsB.length,
        confirmados: apptB.length,
        // Porcentaje de ocupación con 1 decimal, 0 si no hay slots
        ocupacion:   slotsB.length > 0 ? ((apptB.length / slotsB.length) * 100).toFixed(1) : 0,
      };
    });

    // Retornar todas las métricas calculadas para uso en AnalyticsPage
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
