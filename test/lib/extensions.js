'use strict';

var should = require ('should'); /* jshint ignore:line */

exports.register = function (extension, callback) {
  var optArgRequired = {
    wizard: false,
    params: {
      required: 'arg',
    },
  };
  var optArgOptional = {
    wizard: false,
    params: {
      optional: 'opt',
    },
  };

  extension
    .command ('test0', '', optArgRequired, function (callback, args) {
      args[0].should.be.equal ('the argument');
      callback ();
    })
    .command ('test1', '', optArgRequired, function (callback) {
      callback ();
    })
    .command ('test2', '', optArgOptional, function (callback, args) {
      args.length.should.be.equal (0);
      callback ();
    })
    .command ('test3', '', optArgOptional, function (callback, args) {
      args.length.should.be.equal (1);
      callback ();
    })
    .command ('test4', '', optArgOptional, function (callback, args) {
      args[0].should.be.equal ('the argument');
      callback ();
    });

  callback ();
};

exports.unregister = function (callback) {
  /* internal stuff */
  callback ();
};
