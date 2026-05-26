import { Accounts } from 'meteor/accounts-base';

Accounts.validateNewUser((user) => {
  const role = user.profile?.role;
  if (!role || !['barbero', 'cliente'].includes(role)) {
    throw new Meteor.Error('invalid-role', 'Rol inválido');
  }
  return true;
});

Accounts.onCreateUser((options, user) => {
  user.profile = {
    name: options.profile?.name || '',
    role: options.profile?.role || 'cliente',
    createdAt: new Date(),
  };
  return user;
});
