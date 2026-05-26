import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Slots } from '/imports/api/slots/slots';

export function useSlots(date) {
  return useTracker(() => {
    const handle = Meteor.subscribe('slots.available', { date });

    return {
      isLoading: !handle.ready(),
      slots: Slots.find({ date }).fetch(),
    };
  }, [date]);
}
