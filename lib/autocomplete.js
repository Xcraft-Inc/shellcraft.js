/* The MIT License (MIT)
 *
 * Copyright (c) 2014-2015 Xcraft <mathieu@schroetersa.ch>
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
 * AutoComplete constructor.
 */
function AutoComplete (shellcraft) {
  this.minLength = 0;
  this.extraLength = 4;
  this.cmdList = [];
  this.sc = shellcraft;

  this.reload ();
}

/**
 * API private
 */
AutoComplete.prototype.ttyWidth = function () {
  if (process.stdout.getWindowSize) {
    return process.stdout.getWindowSize ()[0];
  }

  var tty = require ('tty');
  return tty.getWindowSize ? tty.getWindowSize ()[1] : 0;
};

AutoComplete.prototype.reload = function () {
  var self = this;

  self.cmdList = [];

  /* Extract only the commands (ignore private and options). */
  Object.keys (Object.getPrototypeOf (self.sc.arguments)).forEach (function (
    fct
  ) {
    if (
      self.sc.arguments.hasOwnProperty (fct) ||
      /^_/.test (fct) ||
      self.sc.arguments[fct].type () !== 'command' ||
      !self.sc.arguments[fct].isScoped (self.sc._scope)
    ) {
      return;
    }

    if (fct.length > self.minLength) {
      self.minLength = fct.length;
    }
    self.cmdList.push (fct);
  });
};

AutoComplete.prototype.begin = function () {
  var self = this;

  var escape = function (s) {
    return s.replace (/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  var cmd = [];
  if (self.sc.uiPrompt.rl.line.length) {
    /* Nothing to auto-complete. */
    if (/[ ]$/.test (self.sc.uiPrompt.rl.line)) {
      return;
    }

    self.cmdList.forEach (function (fct) {
      var res = new RegExp ('^' + escape (self.sc.uiPrompt.rl.line)).test (fct);
      if (res) {
        cmd.push (fct);
      }
    });
  }

  if (cmd.length === 1) {
    /* Simple auto-complete (one command). */
    self.sc.uiPrompt.rl.write (null, {ctrl: true, name: 'u'});
    self.sc.uiPrompt.rl.write (cmd[0] + ' ');
    return;
  }

  /* Show all commands if empty. */
  if (!cmd.length) {
    cmd = self.cmdList;
  }

  var line = cmd[0];
  var userLine = self.sc.uiPrompt.rl.line;
  self.sc.uiPrompt.rl.write (null, {ctrl: true, name: 'u'});

  var cmdDump = [];

  cmd.forEach (function (fct, index) {
    /* Append spaces for vert-align in the dump. */
    cmdDump[index] =
      fct +
      new Array (self.minLength - fct.length + self.extraLength).join (' ');

    /* Detect the smaller common string between all commands. */
    var idx = index < cmd.length - 1 ? index + 1 : 0;
    while (!new RegExp ('^' + escape (fct)).test (cmd[idx])) {
      fct = fct.slice (0, -1);
    }
    if (line > fct) {
      line = fct;
    }
  });

  /* Restore the user entry if the auto-complete line is empty. */
  if (!line.length && userLine.length) {
    cmdDump = [];
    line = userLine;
  }

  if (cmdDump.length) {
    /* Vert-align correctly the commands line-by-line. */
    var w =
      self.ttyWidth () || cmdDump.length * (self.minLength + self.extraLength);
    var nb = parseInt (w / (self.minLength + self.extraLength));

    process.stdout.write ('\n');
    var i = 0;
    cmdDump.forEach (function (fct) {
      if (i && i % nb === 0) {
        process.stdout.write ('\n');
      }
      process.stdout.write (fct);
      ++i;
    });
    process.stdout.write ('\n\n');
  }

  self.sc.uiPrompt.rl.write (line);
};

exports = module.exports = AutoComplete;
