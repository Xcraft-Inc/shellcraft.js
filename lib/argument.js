'use strict';

/**
 * Argument constructor.
 */
function Argument (handler, options, desc) {
  this._parent  = null;
  this._name    = null;
  this._options = options;
  this._desc    = desc;
  this._handler = handler;
  return this;
}

Argument.prototype._setName = function (name) {
  this._name = name;
};

Argument.prototype._setParent = function (parent) {
  this._parent = parent;
};

Argument.prototype.isBuiltIn = function () {
  return this._options.builtIn ? true : false;
};

Argument.prototype.isWizard = function () {
  return this._options.wizard ? true : false;
};

Argument.prototype.hasRequired = function () {
  if (this._options.hasOwnProperty ('params') &&
      this._options.params &&
      this._options.params.hasOwnProperty ('required') &&
      this._options.params.required.length) {
    return this._options.params.required;
  }
  return null;
};

Argument.prototype.params = function () {
  if (this._options.hasOwnProperty ('params') && this._options.params) {
    var cmd = '';
    if (this._options.params.hasOwnProperty ('required')) {
      cmd += ' <' + this._options.params.required + '>';
    }
    if (this._options.params.hasOwnProperty ('optional')) {
      cmd += ' [' + this._options.params.optional + ']';
    }
    return cmd;
  }
  return '';
};

Argument.prototype.help = function (onlyDesc) {
  var help = '';
  if (!onlyDesc) {
    help += ' ' + this._name;
    help += this.params ();
    help += new Array (this._parent._helpWidth () - help.length).join (' ');
  }

  help += this._desc;
  return help;
};

Argument.prototype.call = function () {
  return this._handler.apply (this, arguments);
};

Argument.prototype.type = function () {
  return 'argument';
};

exports = module.exports = Argument;
