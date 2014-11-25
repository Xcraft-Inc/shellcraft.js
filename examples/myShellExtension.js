'use strict';

var zog = 'zog';

var cmd = {};
var opt = {};

cmd.hello = function (callback, args) {
  console.log (zog + ' tells "Hello, ' + args.join (' ') + '"');
  callback ();
};

cmd.wizard = function (callback) {
  var wizard = [{
    /* Inquirer definition... */
    type: 'input',
    name: 'zog',
    message: 'tell ' + zog
  }];

  callback (wizard, function (answers) {
    /* stuff on answers */
    if (answers.zog === zog) {
      console.log (zog + ' ' + zog);
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

opt.foobar = function (callback, args) {
  if (args) {
    zog = args[0];
  } else {
    zog = 'lokthar';
  }
  callback ();
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

  var options = [{
    name: '-f, --foobar',
    desc: 'zog is foobar',
    options: {
      params: {
        required: 'who'
      }
    },
    handler: opt.foobar
  }];

  callback (null, commands, options);
};

exports.unregister = function (callback) {
  /* internal stuff */
  callback ();
};
