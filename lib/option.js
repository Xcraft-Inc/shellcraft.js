'use strict';

var util     = require ('util');
var Argument = require ('./argument.js');

/**
 * Option constructor.
 */
function Option (handler, options, desc) {
  Option.super_.apply (this, [handler, options, desc]);

  if (options.params && options.params.hasOwnProperty ('optional')) {
    throw new Error ('optional parameter is not allowed for options');
  }
}

util.inherits (Option, Argument);

Option.prototype.type = function () {
  return 'option';
};

exports = module.exports = Option;
