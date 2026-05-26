import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Appointments } from '/imports/api/appointments/appointments';

export function useAppointments() {
  return useTracker(() => {
    const handle = Meteor.subscribe('appointments.today');

    return {
      isLoading: !handle.ready(),
      appointments: Appointments.find(
        {},
        { sort: { hour: 1 } }
      ).fetch(),
    };
  });
}