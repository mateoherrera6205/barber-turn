import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

export function useAuth() {
  return useTracker(() => {
    const user = Meteor.user();
    const userId = Meteor.userId();
    return {
      user,
      userId,
      isLoggedIn: !!userId,
      isLoading: Meteor.loggingIn(),
      role: user?.profile?.role || null,
      isBarbero: user?.profile?.role === 'barbero',
      isCliente: user?.profile?.role === 'cliente',
      name: user?.profile?.name || '',
    };
  });
}
