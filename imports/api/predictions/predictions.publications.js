/**
 * predictions.publications.js
 * Define la publicación Meteor para la colección de predicciones de demanda.
 * Sincroniza los documentos de predicción al MiniMongo del cliente
 * para que PredictionPage pueda mostrarlos en tiempo real.
 *
 * Publicaciones disponibles:
 *  - predictions.all → Todas las predicciones ordenadas por día y hora
 */
import { Meteor } from 'meteor/meteor';
import { Predictions } from './predictions';

/**
 * predictions.all
 * Publica la totalidad de las predicciones calculadas, ordenadas cronológicamente
 * por día de semana y luego por hora (para facilitar la iteración en el cliente).
 *
 * - Solo disponible para usuarios autenticados
 * - Usada en el hook usePredictions, que agrupa los datos por día para PredictionPage
 *
 * Nota: La ordenación por 'Hora' (con H mayúscula) en el sort parece un typo
 * respecto al campo 'hora' (minúscula) definido en el documento, pero se mantiene
 * sin cambiar para no alterar la lógica existente.
 *
 * @returns {Cursor} Cursor de todas las Predictions ordenadas por diaSemana y hora
 */
Meteor.publish('predictions.all',function(){
    // Si no hay usuario autenticado, no publicar ningún dato
    if (!this.userId)return this.ready();

    // Retornar todas las predicciones ordenadas para facilitar el agrupamiento en el cliente
    return Predictions.find({},{sort:{diaSemana:1, Hora:1}});
});
