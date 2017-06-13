/* The author disclaims copyright to this source code.  In place of
 * a legal notice, here is a blessing:
 *
 *    May you do good and not evil.
 *    May you find forgiveness for yourself and forgive others.
 *    May you share freely, never taking more than you give.
 */

'use strict';

var zog = 'zog';

var cmd = {};
var opt = {};

cmd.hello = function (callback, args) {
  console.log (zog + ' tells "Hello, ' + args.join (' ') + '"');
  callback ();
};

cmd.wizard = function (callback) {
  var wizard = [
    {
      /* Inquirer definition... */
      type: 'input',
      name: 'zog',
      message: 'tell ' + zog,
    },
  ];

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
    .command (
      'hello',
      'print Hello, John',
      {
        wizard: false,
        params: {
          required: 'name',
          optional: 'etc...',
        },
      },
      cmd.hello
    )
    .command (
      'required',
      'multiple required arguments',
      {
        wizard: false,
        params: {
          required: ['firstname', 'lastname'],
        },
      },
      cmd.hello
    )
    .command (
      'optional',
      'multiple optional arguments',
      {
        wizard: false,
        params: {
          optional: ['pseudo', 'hobby'],
        },
      },
      cmd.hello
    )
    .command (
      'optional-inf',
      'multiple optional arguments',
      {
        wizard: false,
        params: {
          optional: ['pseudo', 'hobby...'],
        },
      },
      cmd.hello
    )
    .command (
      'required-optional',
      'multiple required and optional arguments',
      {
        wizard: false,
        params: {
          required: ['firstname', 'lastname'],
          optional: ['pseudo', 'hobby'],
        },
      },
      cmd.hello
    )
    .command (
      'wizard',
      'begins a wizard',
      {
        wizard: true,
        scope: 'warcraft',
      },
      cmd.wizard
    )
    .option (
      '-f, --foobar',
      'zog is foobar',
      {
        params: {
          required: 'who',
        },
      },
      opt.foobar
    );

  callback ();
};

exports.unregister = function (callback) {
  /* internal stuff */
  callback ();
};
