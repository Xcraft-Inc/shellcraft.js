'use strict';

/**
 * ArgumentsList constructor.
 */
function Extension (shellcraft) {
  this.sc = shellcraft;
}

Extension.prototype.command = function (name, desc, options, handler) {
  var Command = require ('./command.js');
  this.sc.arguments._add (name, new Command (handler, options, desc));
  return this;
};

Extension.prototype.option = function (name, desc, options, handler) {
  var Option = require ('./option.js');
  this.sc.arguments._add (name, new Option (handler, options, desc));
  return this;
};

exports = module.exports = Extension;
