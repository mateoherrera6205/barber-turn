import { Meteor } from 'meteor/meteor';
import { Predictions } from './predictions';

Meteor.publish('predictions.all',function(){
    if (!this.userId)return this.ready();
    return Predictions.find({},{sort:{diaSemana:1, Hora:1}});           
});