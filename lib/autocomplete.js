'use strict';

/**
 * AutoComplete constructor.
 */
function AutoComplete (shellcraft) {
  this.minLength = 0;
  this.cmdList   = [];
  this.sc        = shellcraft;

  this.reload ();
}

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
    cmdDump[index] = fct + new Array (self.minLength - fct.length + 4).join (' ');

    /* Detect the smaller common string between all commands. */
    while (index < cmd.length - 1 && !new RegExp ('^' + fct).test (cmd[index + 1])) {
      fct = fct.slice (0, -1);
      line = fct;
    }
  });

  console.log ('\n' + cmdDump.join ('') + '\n');
  self.sc.uiPrompt.rl.prompt ();
  self.sc.uiPrompt.rl.write (line);
};

exports = module.exports = AutoComplete;
