const DIAS_NOMBRE = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado',
};

/**
 * StaffingPlanner
 * Clase pura (sin Mongo) que convierte un array de predicciones enriquecidas
 * en un plan de acción concreto para gestión de barberos.
 *
 * Responsabilidad única: transformar predicciones en acciones recomendadas.
 * No accede a ninguna colección; toda la lógica es determinista y testeable.
 */
export class StaffingPlanner {
  /**
   * generarPlan
   * @param {Object[]} predicciones — array con campos: diaSemana, hora,
   *   barberosRecomendados, capacidadProgramada, gap, clientesEsperados,
   *   ocupacionHistorica, riesgoCancelacion
   * @returns {Object[]} acciones { diaSemana, hora, tipo, mensaje, prioridad }
   */
  generarPlan(predicciones) {
    const acciones = [];

    // Agrupar por día para resolver reasignaciones dentro del mismo día
    const porDia = new Map();
    for (const p of predicciones) {
      if (!porDia.has(p.diaSemana)) porDia.set(p.diaSemana, []);
      porDia.get(p.diaSemana).push(p);
    }

    for (const [dia, franjas] of porDia) {
      const nombreDia = DIAS_NOMBRE[dia] || `Día ${dia}`;

      // Copias mutables para descontar movimientos de reasignación
      const working = franjas.map(f => ({ ...f, gapRestante: f.gap }));
      const excedentes = working.filter(f => f.gapRestante < 0);
      const deficits   = working.filter(f => f.gapRestante > 0);

      // Emparejamiento excedente→déficit dentro del mismo día
      for (const exc of excedentes) {
        for (const def of deficits) {
          if (exc.gapRestante < 0 && def.gapRestante > 0) {
            const mover = Math.min(-exc.gapRestante, def.gapRestante);
            const s = mover !== 1 ? 's' : '';
            acciones.push({
              diaSemana: dia,
              hora: def.hora,
              tipo: 'reasignar',
              mensaje: `${nombreDia}: mueve ${mover} barbero${s} de ${exc.hora} (excedente) a ${def.hora} (déficit)`,
              prioridad: 1,
            });
            exc.gapRestante += mover;
            def.gapRestante -= mover;
          }
        }
      }

      // Déficits residuales → agregar
      for (const f of working.filter(w => w.gapRestante > 0)) {
        const g = f.gapRestante;
        const sRec = f.barberosRecomendados !== 1 ? 's' : '';
        const sGap = g !== 1 ? 's' : '';
        acciones.push({
          diaSemana: dia,
          hora: f.hora,
          tipo: 'agregar',
          mensaje: `${nombreDia} ${f.hora} — demanda estimada ${f.barberosRecomendados} barbero${sRec}, programados ${f.capacidadProgramada}: agrega ${g} barbero${sGap}`,
          prioridad: 1,
        });
      }

      // Excedentes residuales con muy baja demanda → reducir
      for (const f of working.filter(w => w.gapRestante < 0 && w.clientesEsperados < w.capacidadProgramada * 0.5)) {
        const g = -f.gapRestante;
        const s = g !== 1 ? 's' : '';
        acciones.push({
          diaSemana: dia,
          hora: f.hora,
          tipo: 'reducir',
          mensaje: `considera liberar ${g} barbero${s} en esta franja`,
          prioridad: 2,
        });
      }

      // Alta tasa de cancelación → confirmar (independiente del gap)
      for (const f of franjas.filter(fr => fr.riesgoCancelacion >= 0.30 && fr.clientesEsperados >= 1)) {
        const pct = Math.round(f.riesgoCancelacion * 100);
        acciones.push({
          diaSemana: dia,
          hora: f.hora,
          tipo: 'confirmar',
          mensaje: `${pct}% de cancelación histórica: envía recordatorios el día previo`,
          prioridad: 2,
        });
      }
    }

    return acciones;
  }
}
