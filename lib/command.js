'use strict';

var util     = require ('util');
var Argument = require ('./argument.js');

/**
 * Command constructor.
 */
function Command (handler, options, desc) {
  Command.super_.apply (this, [handler, options, desc]);
}

util.inherits (Command, Argument);

Command.prototype.type = function () {
  return 'command';
};

exports = module.exports = Command;
