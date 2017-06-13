/* The MIT License (MIT)
 *
 * Copyright (c) 2014 Xcraft <mathieu@schroetersa.ch>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

/**
 * Argument constructor.
 */
function Argument (handler, options, desc) {
  if (!options.hasOwnProperty ('scope')) {
    options.scope = 'global';
  }
  this._parent = null;
  this._name = null;
  this._options = options;
  this._desc = desc;
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

Argument.prototype.isScoped = function (scope) {
  switch (this._options.scope) {
    case '*':
    case scope: {
      return true;
    }
    default: {
      return false;
    }
  }
};

Argument.prototype.isWizard = function () {
  return this._options.wizard ? true : false;
};

Argument.prototype.getRequired = function () {
  if (
    this._options.hasOwnProperty ('params') &&
    this._options.params &&
    this._options.params.hasOwnProperty ('required') &&
    this._options.params.required.length
  ) {
    return Array.isArray (this._options.params.required)
      ? this._options.params.required
      : [this._options.params.required];
  }
  return [];
};

Argument.prototype.getOptional = function () {
  if (
    this._options.hasOwnProperty ('params') &&
    this._options.params &&
    this._options.params.hasOwnProperty ('optional') &&
    this._options.params.optional.length
  ) {
    return Array.isArray (this._options.params.optional)
      ? this._options.params.optional
      : [this._options.params.optional];
  }
  return [];
};

Argument.prototype.scope = function () {
  return this._options.scope;
};

Argument.prototype.params = function () {
  if (this._options.hasOwnProperty ('params') && this._options.params) {
    var cmd = '';
    if (this._options.params.hasOwnProperty ('required')) {
      var reqList = this._options.params.required;
      if (!Array.isArray (reqList)) {
        reqList = [reqList];
      }
      reqList.forEach (function (req) {
        cmd += ' <' + req + '>';
      });
    }
    if (this._options.params.hasOwnProperty ('optional')) {
      var optList = this._options.params.optional;
      if (!Array.isArray (optList)) {
        optList = [optList];
      }
      optList.forEach (function (opt) {
        cmd += ' [' + opt + ']';
      });
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

  help += typeof this._desc === 'function' ? this._desc () : this._desc;
  return help;
};

Argument.prototype.call = function () {
  return this._handler.apply (this, arguments);
};

Argument.prototype.type = function () {
  return 'argument';
};

exports = module.exports = Argument;
