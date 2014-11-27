'use strict';

/**
 * AutoComplete constructor.
 */
function AutoComplete (shellcraft) {
  this.minLength = 0;
  this.cmdList   = [];
  this.sc        = shellcraft;
  this.extraLength = 4;

  this.reload ();
}

/**
 * @api private
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
  Object.keys (Object.getPrototypeOf (self.sc.arguments)).forEach (function (fct) {
    if (self.sc.arguments.hasOwnProperty (fct) ||
        /^_/.test (fct) ||
        self.sc.arguments[fct].type () !== 'command') {
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

  var cmd = [];
  if (self.sc.uiPrompt.rl.line.length) {
    self.cmdList.forEach (function (fct) {
      var res = new RegExp ('^' + self.sc.uiPrompt.rl.line).test (fct);
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

  var line = self.sc.uiPrompt.rl.line;
  self.sc.uiPrompt.rl.write (null, {ctrl: true, name: 'u'});

  var cmdDump = [];

  cmd.forEach (function (fct, index) {
    /* Append spaces for vert-align in the dump. */
    cmdDump[index] = fct + new Array (self.minLength - fct.length + self.extraLength).join (' ');

    /* Detect the smaller common string between all commands. */
    while (index < cmd.length - 1 && !new RegExp ('^' + fct).test (cmd[index + 1])) {
      fct = fct.slice (0, -1);
      line = fct;
    }
  });

  /* Vert-align correctly the commands line-by-line. */
  var w  = self.ttyWidth () || cmdDump.length * (self.minLength + self.extraLength);
  var nb = parseInt (w / (self.minLength + self.extraLength));

  process.stdout.write ('\n');
  var i = 0;
  cmdDump.forEach (function (fct) {
    if (i && (i % nb) === 0) {
      process.stdout.write ('\n');
    }
    process.stdout.write (fct);
    ++i;
  });
  process.stdout.write ('\n\n');

  /* Then prompt with the completion. */
  self.sc.uiPrompt.rl.prompt ();
  self.sc.uiPrompt.rl.write (line);
};

exports = module.exports = AutoComplete;
