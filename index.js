'use strict';

var util     = require ('util');
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

/**
 * CommandsList constructor.
 */
function ArgumentsList () {
  this._helpLength = 0;
}

ArgumentsList.prototype._helpWidth = function () {
  return this._helpLength + 5;
};

ArgumentsList.prototype._add = function (cmd, obj) {
  var length = cmd.length + obj.params ().length;
  if (length > this._helpLength) {
    this._helpLength = length;
  }

  obj._setName (cmd);
  obj._setParent (this);
  ArgumentsList.prototype[cmd] = obj;
};

/**
 * ShellCraft constructor.
 */
function ShellCraft () {
  var self = this;

  this._exit = false;
  this._shell = true; /* open the shell be default */

  this.arguments = new ArgumentsList ();
  this.arguments._add ('exit', new Command (function (callback) {
    self._exit = true;
    if (callback) {
      callback ();
    }
  }, {builtIn: true}, 'exit the shell'));
  this.arguments._add ('help', new Command (function (callback) {
    Object.keys (Object.getPrototypeOf (self.arguments)).forEach (function (fct) {
      if (!self.arguments.hasOwnProperty (fct) &&
          !/^_/.test(fct) &&
          self.arguments[fct].type () === 'command') {
        console.log (self.arguments[fct].help ());
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
  this.extensions = [];
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
 * @param {function(err, results)} callback
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

  process.stdin.on ('keypress', function (chunk, key) {
    if (!key) {
      return;
    }

    switch (key.name) {
    /* Command history */
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
    /* Command auto-completion */
    case 'tab': {
      var minLength = 0;
      var cmdList = [];
      Object.keys (Object.getPrototypeOf (self.arguments)).forEach (function (fct) {
        if (self.arguments.hasOwnProperty (fct) ||
            /^_/.test (fct) ||
            self.arguments[fct].type () !== 'command') {
          return;
        }
        if (fct.length > minLength) {
          minLength = fct.length;
        }
        cmdList.push (fct);
      });

      var cmd = [];
      if (uiPrompt.rl.line.length) {
        cmdList.forEach (function (fct) {
          var res = new RegExp ('^' + uiPrompt.rl.line).test (fct);
          if (res) {
            cmd.push (fct);
          }
        });
      }

      if (cmd.length === 1) {
        uiPrompt.rl.write (null, {ctrl: true, name: 'u'});
        uiPrompt.rl.write (cmd[0]);
        break;
      } else {
        if (!cmd.length) {
          cmd = cmdList;
        }
        var line = uiPrompt.rl.line;
        uiPrompt.rl.write (null, {ctrl: true, name: 'u'});
        cmd.forEach (function (fct, index) {
          cmd[index] = fct + new Array (minLength - fct.length + 1).join (' ');
        });
        console.log ('\n' + cmd.join (' ') + '\n');
        uiPrompt.rl.prompt ();
        uiPrompt.rl.write (line);
        break;
      }
      break;
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
        var returnToPrompt = inquirerCallback (answers);
        if (returnToPrompt) {
          inquirerCallback = null;
          inquirerPrompt   = self.prompt;
          next (null);
        }
        return;
      }

      /*
       * Normal shell handling for the commands.
       */
      var cmdArgs = answers.command.split (' ');
      var cmd = cmdArgs[0];
      cmdArgs.shift ();

      if (cmd.length && answers.command !== history[history.length - 1]) {
        history.push (answers.command);
      }
      iterator = history.length;

      try {
        if (self.arguments[cmd].type () === 'option') {
          throw new Error ();
        }

        self.arguments[cmd].call (function (data, wizardCallback) {
          /* The next prompt we must start the wizard provided by the client. */
          if (data) {
            if (self.arguments[cmd].isWizard ()) {
              inquirerPrompt = data;
              inquirerCallback = wizardCallback;
            }
          } else {
            inquirerPrompt   = self.prompt;
            inquirerCallback = null;
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
      callback (null, results);
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

  Object.keys (Object.getPrototypeOf (this.arguments)).forEach (function (fct) {
    if (self.arguments.hasOwnProperty (fct) || /^_/.test (fct) || self.arguments[fct].isBuiltIn ()) {
      return;
    }

    var params = self.arguments[fct].params ();

    if (self.arguments[fct].type () === 'option') {
      program
        .option (fct + params,
                 self.arguments[fct].help (true),
                 function () {
                   var args = arguments;

                   /* We force to only one argument with the options. */
                   if (args.length > 1) {
                     args = [args[0]];
                   }
                   self.arguments[fct].call (function () {}, args);
                 });
      return;
    }

    program
      .command (fct + params)
      .description (self.arguments[fct].help (true))
      .action (function (first, next) {
        self._shell = false;

        var values = [];

        if (Array.isArray (first)) {
          values = values.concat (first);
        } else if (first && typeof first !== 'object') {
          values.push (first);
        }
        if (Array.isArray (next)) {
          values = values.concat (next);
        } else if (next && typeof next !== 'object') {
          values.push (next);
        }

        self.arguments[fct].call (function (data, wizardCallback) {
          if (data) {
            if (!self.arguments[fct].isWizard ()) {
              return;
            }
          } else {
            return;
          }

          /* Start the wizard. */
          inquirer.prompt (data, function (answers) {
            wizardCallback (answers);
          });
        }, values);
      });
  });

  program.parse (process.argv);

  if (callback) {
    callback ();
  }
};

/**
 * Close the Command Line Interface (CLI) or the shell.
 *
 * @api private
 * @param {function(err)} callback
 */
ShellCraft.prototype.shutdown = function (callback) {
  async.each (this.extensions, function (ext, callback) {
    ext.unregister (callback);
  }, function (err) {
    callback (err);
  });
};

/**
 * Register external commands.
 *
 * The module must return an array like this:
 * [{
 *   name: 'foobar',
 *   desc: 'foobar description',
 *   options: {
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
ShellCraft.prototype.registerExtension = function (shellExt, callback) {
  var self = this;
  var ext = require (shellExt);

  ext.register (function (err, commands, options) {
    if (!err) {
      if (commands) {
        commands.forEach (function (cmd) {
          self.arguments._add (cmd.name, new Command (cmd.handler, cmd.options, cmd.desc));
        });
      }

      if (options) {
        options.forEach (function (opt) {
          self.arguments._add (opt.name, new Option (opt.handler, opt.options, opt.desc));
        });
      }
    }

    if (callback) {
      callback (err);
    }
  });

  this.extensions.push (ext);
};

/**
 * Begins the Shell or the CLI accordingly to the provided arguments.
 *
 * @param {Object} options
 * @param {function(err, results)} callback
 */
ShellCraft.prototype.begin = function (options, callback) {
  var self = this;
  this.options = options;

  /* Run in command line. */
  this.cli (function () {
    if (self._shell) {
      /* Run the Shell. */
      self.shell (function () {
        self.shutdown (callback);
      });
    } else {
      self.shutdown (callback);
    }
  });
};

exports = module.exports = new ShellCraft ();
