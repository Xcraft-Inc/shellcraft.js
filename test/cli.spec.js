'use strict';

var path = require('path');
var {expect} = require('chai'); /* jshint ignore:line */

var runShellCraft = function (args, callback) {
  var fork = require('child_process').fork;

  var prog = fork(path.join(__dirname, './lib/sc.js'), args, {silent: true});
  prog.on('error', callback).on('close', callback);
};

describe('shellcraft', function () {
  describe('command: test# <arg>', function () {
    it('test0 should retrieve the argument', function (done) {
      var args = ['test0', 'the argument'];

      runShellCraft(args, function (code) {
        expect(code).be.equal(0);
        done();
      });
    });

    it('test1 should fail because the argument is missing', function (done) {
      var args = ['test1'];

      runShellCraft(args, function (code) {
        expect(code).be.equal(1);
        done();
      });
    });
  });

  describe('command: test# [arg]', function () {
    it('test2 should not fail if the argument is missing', function (done) {
      var args = ['test2'];
      /* no argument provided to test2... */

      runShellCraft(args, function (code) {
        expect(code).be.equal(0);
        done();
      });
    });

    it('test3 should fail if the number of arguments is greater than 1', function (done) {
      var args = [
        'test3',
        'arg1',
        'arg2' /* this argument should be dropped */,
      ];

      runShellCraft(args, function (code) {
        expect(code).be.equal(0);
        done();
      });
    });

    it('test4 should retrieve the argument', function (done) {
      var args = ['test4', 'the argument'];

      runShellCraft(args, function (code) {
        expect(code).be.equal(0);
        done();
      });
    });

    it('test5 should fail if the number of arguments is not 3', function (done) {
      var args = ['test5', 'arg1', 'arg2', 'arg3'];

      runShellCraft(args, function (code) {
        expect(code).be.equal(0);
        done();
      });
    });
  });
});
