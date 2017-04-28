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
 * ArgumentsList constructor.
 */
function Extension (shellcraft) {
  this.sc = shellcraft;
}

/**
 * Add a new command to ShellCraft.
 *
 * @param {string} name - Command's name without space.
 * @param {string} desc - Command's description.
 * @param {Object} options
 * @param {function(callback, args)} handler
 * @returns {Extension} this
 */
Extension.prototype.command = function (name, desc, options, handler) {
  var Command = require ('./command.js');
  this.sc.arguments._add (name, new Command (handler, options, desc));
  return this;
};

/**
 * Add a new option to ShellCraft.
 *
 * @param {string} name - Option's name without space.
 * @param {string} desc - Option's description.
 * @param {Object} options
 * @param {function(callback, args)} handler
 * @returns {Extension} this
 */
Extension.prototype.option = function (name, desc, options, handler) {
  var Option = require ('./option.js');
  this.sc.arguments._add (name, new Option (handler, options, desc));
  return this;
};

/**
 * Remove a command or an option.
 *
 * @param {string} name - Option's name without space.
 * @returns {Extension} this
 */
Extension.prototype.remove = function (name) {
  this.sc.arguments._remove (name);
  return this;
};

exports = module.exports = Extension;
