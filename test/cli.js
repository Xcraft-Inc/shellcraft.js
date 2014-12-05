'use strict';

var path   = require ('path');
var should = require ('should'); /* jshint ignore:line */

var runShellCraft = function (args, callback) {
  var fork = require ('child_process').fork;

  var prog = fork (path.join (__dirname, './sc.js'), args, {silent: true});
  prog
    .on ('error', callback)
    .on ('close', callback);
};

describe ('command: test# <arg>', function () {
  it ('test0 should retrieve the argument', function (done) {
    var args = [
      'test0',
      'the argument'
    ];

    runShellCraft (args, function () {
      done ();
    });
  });

  it ('test1 should fail because the argument is missing', function (done) {
    var args = ['test1'];

    runShellCraft (args, function (code) {
      code.should.be.equal (1);
      done ();
    });
  });
});

describe ('command: test# [arg]', function () {
  it ('test2 should not fail if the argument is missing', function (done) {
    var args = ['test2'];
    /* no argument provided to test2... */

    runShellCraft (args, function () {
      done ();
    });
  });

  it ('test3 should fail if the number of arguments is greater than 1', function (done) {
    var args = [
      'test3',
      'arg1',
      'arg2' /* this argument should be dropped */
    ];

    runShellCraft (args, function () {
      done ();
    });
  });

  it ('test4 should retrieve the argument', function (done) {
    var args = [
      'test4',
      'the argument'
    ];

    runShellCraft (args, function () {
      done ();
    });
  });
});
