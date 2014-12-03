'use strict';

var path       = require ('path');
var should     = require ('should'); /* jshint ignore:line */
var shellcraft = require ('../');

var runShellCraft = function (callback) {
  var ext = path.join (__dirname, 'lib/extensions.js');
  shellcraft.registerExtension (ext, function () {
    shellcraft.begin ({}, callback);
  });
};

process.exit = function (code) {
  throw new Error (code);
};

describe ('command: test# <arg>', function () {
  beforeEach (function (done) {
    delete process.argv;
    process.argv = ['node', 'test'];
    done ();
  });

  it ('test0 should retrieve the argument', function (done) {
    process.argv[2] = 'test0';
    process.argv[3] = 'the argument';

    runShellCraft (function () {
      done ();
    });
  });

  it ('test1 should fail because the argument is missing', function (done) {
    process.argv[2] = 'test1';

    try {
      runShellCraft (function () {
        done ();
      });
    } catch (ex) {
      ex.message.should.be.equal ('1');
    }
    done ();
  });
});

describe ('command: test# [arg]', function () {
  it ('test2 should not fail if the argument is missing', function (done) {
    process.argv[2] = 'test2';
    /* no argument provided to test2... */

    runShellCraft (function () {
      done ();
    });
  });

  it ('test3 should fail if the number of arguments is greater than 1', function (done) {
    process.argv[2] = 'test3';
    process.argv[3] = 'arg1';
    process.argv[4] = 'arg2'; /* this argument should be dropped */

    runShellCraft (function () {
      done ();
    });
  });

  it ('test4 should retrieve the argument', function (done) {
    process.argv[2] = 'test4';
    process.argv[3] = 'the argument';

    runShellCraft (function () {
      done ();
    });
  });
});
