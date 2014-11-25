'use strict';

var cmd = {};

cmd.hello = function (callback, args) {
  console.log ('Hello, ' + args.join (' '));
  callback ();
};

cmd.wizard = function (callback) {
  var wizard = [{
    /* Inquirer definition... */
    type: 'input',
    name: 'zog',
    message: 'tell zog'
  }];

  callback (wizard, function (answers) {
    /* stuff on answers */
    if (answers.zog === 'zog') {
      console.log ('zog zog');
    } else {
      console.log ('lokthar?');
    }

    /*
    * You can return false if you must provide several wizard with only
    * one call to this command handler.
    * You can call callback () without argument in order to return to the
    * prompt instead of returning true.
    */
    return true;
  });
};

exports.register = function (callback) {
  var commands = [{
    name    : 'hello',
    desc    : 'print Hello, John',
    options : {
      wizard : false,
      params : {
        required: 'name',
        optional: 'etc...'
      }
    },
    handler : cmd.hello
  }, {
    name    : 'wizard',
    desc    : 'begins a wizard',
    options : {
      wizard : true
    },
    handler : cmd.wizard
  }];

  callback (null, commands);
};

exports.unregister = function (callback) {
  /* internal stuff */
  callback ();
};
