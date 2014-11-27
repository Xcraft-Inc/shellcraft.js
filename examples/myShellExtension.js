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

exports.register = function (extension, callback) {
  extension
    .command ('hello', 'print Hello, John', {
      wizard: false,
      params: {
        required: 'name',
        optional: 'etc...'
      }
    }, cmd.hello)
    .command ('wizard', 'begins a wizard', {
      wizard: true
    }, cmd.wizard)
    .option ('-f, --foobar', 'zog is foobar', {
      params: {
        required: 'who'
      }
    }, opt.foobar);

  callback ();
};

exports.unregister = function (callback) {
  /* internal stuff */
  callback ();
};
