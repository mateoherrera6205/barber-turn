import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';

Meteor.methods({
  'users.register'({ name, email, password, role }) {
    check(name, String);
    check(email, String);
    check(password, String);
    check(role, String);

    const userId = Accounts.createUser({
      email,
      password,
      profile: { name, role },
    });
    return userId;
  }
});
