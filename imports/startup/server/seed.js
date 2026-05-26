import { Meteor } from 'meteor/meteor';
import { runSeed } from '/bot/seed';

export const initSeed = async () => {
  // Solo correr si no hay datos históricos
  const totalSlots = await Slots.countDocuments();
  if (totalSlots < 100) {
    console.log('📊 Pocos datos históricos, corriendo seed...');
    await runSeed();
  }
};
