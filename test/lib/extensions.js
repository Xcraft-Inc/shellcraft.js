'use strict';

var should = require ('should'); /* jshint ignore:line */

exports.register = function (extension, callback) {
  var optArgRequired = {
    wizard: false,
    params: {
      required: 'arg'
    }
  };

  extension
    .command ('test0', '', optArgRequired, function (callback, args) {
      args[0].should.be.equal ('the argument');
      callback ();
    })
    .command ('test1', '', optArgRequired, function (callback) {
      callback ();
    });

  callback ();
};

exports.unregister = function (callback) {
  /* internal stuff */
  callback ();
};
