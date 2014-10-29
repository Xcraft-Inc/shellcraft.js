'use strict';

var async    = require ('async');
var inquirer = require ('inquirer');


/**
 * Prompt constructor.
 */
function Prompt () {
  return [{
    type    : 'input',
    name    : 'command',
    message : '>'
  }];
}

/**
 * Command constructor.
 */
function Command (handler, params, desc) {
  this._parent  = null;
  this._name    = null;
  this._params  = params;
  this._desc    = desc;
  this._handler = handler;
  return this;
}

Command.prototype._setName = function (name) {
  this._name = name;
};

Command.prototype._setParent = function (parent) {
  this._parent = parent;
};

Command.prototype.isBuiltIn = function () {
  return this._params.builtIn ? true : false;
};

Command.prototype.isWizard = function () {
  return this._params.wizard ? true : false;
};

Command.prototype.help = function (onlyDesc) {
  var help = '';
  if (!onlyDesc) {
    help += ' ' + this._name;
    help += new Array (this._parent._helpWidth () - this._name.length).join (' ');
  }

  help += this._desc;
  return help;
};

Command.prototype.call = function () {
  return this._handler.apply (this, arguments);
};

/**
 * CommandsList constructor.
 */
function CommandsList () {
  this._helpLength = 0;
}

CommandsList.prototype._helpWidth = function () {
  return this._helpLength + 5;
};

CommandsList.prototype._add = function (cmd, obj) {
  if (cmd.length > this._helpLength) {
    this._helpLength = cmd.length;
  }

  obj._setName (cmd);
  obj._setParent (this);
  CommandsList.prototype[cmd] = obj;
};

/**
 * ShellCraft constructor.
 */
function ShellCraft () {
  var self = this;

  this._exit = false;

  this.commands = new CommandsList ();
  this.commands._add ('exit', new Command (function (callback) {
    self._exit = true;
    if (callback) {
      callback ();
    }
  }, {builtIn: true}, 'exit the shell'));
  this.commands._add ('help', new Command (function (callback) {
    Object.keys (Object.getPrototypeOf (self.commands)).forEach (function (fct) {
      if (!self.commands.hasOwnProperty (fct) && !/^_/.test(fct)) {
        console.log (self.commands[fct].help ());
      }
    });
    if (callback) {
      callback ();
    }
  }, {builtIn: true}, 'list of commands'));

  this.options = {
    version: '0.0.1'
  };
  this.prompt  = new Prompt ();
}

/**
 * Check if we must exit the shell.
 *
 * @api private
 * @returns {boolean} Exit status.
 */
ShellCraft.prototype.isExit = function () {
  return this._exit;
};

/**
 * Start the Shell interface.
 *
 * @api private
 * @param {function(results)} callback
 */
ShellCraft.prototype.shell = function (callback) {
  var self = this;

  if (this.options.prompt) {
    this.prompt[0].message = this.options.prompt;
  }

  var history = [];
  var iterator = 0;

  process.stdin.setRawMode (true);
  var uiPrompt = {};

  /*
   * Handle command history.
   */
  process.stdin.on ('keypress', function (chunk, key) {
    if (key) {
      switch (key.name) {
      case 'up': {
        if (iterator > 0) {
          --iterator;
        }
        uiPrompt.rl.write (null, {ctrl: true, name: 'u'});
        uiPrompt.rl.write (history[iterator]);
        break;
      }
      case 'down': {
        uiPrompt.rl.write (null, {ctrl: true, name: 'u'});
        if (iterator < history.length - 1) {
          ++iterator;
          uiPrompt.rl.write (history[iterator]);
        } else {
          iterator = history.length;
        }
        break;
      }
      }
    }
  });

  var inquirerCallback = null;
  var inquirerPrompt   = self.prompt;

  async.forever (function (next) {
    uiPrompt = inquirer.prompt (inquirerPrompt, function (answers) {
      /*
       * Special handling when the command returns an Inquirer definition. In
       * this case we must return the answers to the caller.
       */
      if (inquirerCallback) {
        inquirerCallback (answers);
        inquirerCallback = null;
        inquirerPrompt   = self.prompt;
        next (null);
        return;
      }

      /*
       * Normal shell handling for the commands.
       */
      var cmdArgs = answers.command.split (' ');
      var cmd = cmdArgs[0];
      cmdArgs.shift ();

      if (cmd.length && cmd !== history[history.length - 1]) {
        history.push (cmd);
      }
      iterator = history.length;

      try {
        self.commands[cmd].call (function (data, wizardCallback) {
          /* The next prompt we must start the wizard provided by the client. */
          if (self.commands[cmd].isWizard ()) {
            inquirerPrompt = data;
            inquirerCallback = wizardCallback;
          }
          next (self.isExit () ? 'good bye' : null);
        }, cmdArgs);
      } catch (ex) {
        if (answers.command.length) {
          console.log ('command ' + cmd + ' unknown');
        }

        next (null);
      }
    });
  }, function (results) {
    if (callback) {
      callback (results);
    }
  });
};

/**
 * Start the Command Line Interface (CLI).
 *
 * @api private
 * @param {function(results)} callback
 */
ShellCraft.prototype.cli = function (callback) {
  var self = this;
  var program = require ('commander');

  program.version (this.options.version);

  Object.keys (Object.getPrototypeOf (this.commands)).forEach (function (fct) {
    if (self.commands.hasOwnProperty (fct) || /^_/.test (fct) || self.commands[fct].isBuiltIn ()) {
      return;
    }

    program.option (fct, self.commands[fct].help (true), function (arg) {
      self.commands[fct].call (function (data, wizardCallback) {
        if (!self.commands[fct].isWizard ()) {
          if (callback) {
            callback ();
          }
          return;
        }

        /* Start the wizard. */
        inquirer.prompt (data, function (answers) {
          wizardCallback (answers);
          if (callback) {
            callback ();
          }
        });
      }, arg);
    });
  });

  program.parse (process.argv);
};

/**
 * Register external commands.
 *
 * The module must return an array like this:
 * [{
 *   name: 'foobar',
 *   desc: 'foobar description',
 *   params: {
 *     wizard: false
 *   },
 *   handler: function (callback) {
 *     console.log ('run foobar');
 *     callback ();
 *   }
 * }]
 *
 * The callback function must always be called.
 *
 * @param {string} shellExt - Path on the shell extension file.
 */
ShellCraft.prototype.registerExtension = function (shellExt) {
  var self = this;
  var extension = require (shellExt);

  extension.forEach (function (cmd) {
    self.commands._add (cmd.name, new Command (cmd.handler, cmd.params, cmd.desc));
  });
};

/**
 * Begins the Shell or the CLI accordingly to the provided arguments.
 *
 * @param {Object} options
 * @param {function(results)} callback
 */
ShellCraft.prototype.begin = function (options, callback) {
  this.options = options;

  /* Run the Shell. */
  if (process.argv.length === 2) {
    this.shell (callback);
    return;
  }

  /* Run in command line. */
  this.cli (callback);
};

exports = module.exports = new ShellCraft ();
