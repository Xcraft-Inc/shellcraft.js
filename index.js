'use strict';

var async    = require ('async');
var inquirer = require ('inquirer');

var Command  = require ('./lib/command.js');

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
 * ShellCraft constructor.
 */
function ShellCraft () {
  var self = this;

  var ArgumentsList = require ('./lib/argumentslist.js');

  self._exit = false;
  self._shell = true; /* open the shell be default */

  self.arguments = new ArgumentsList ();
  self.arguments._add ('exit', new Command (function (callback) {
    self._exit = true;
    if (callback) {
      callback ();
    }
  }, {builtIn: true}, 'exit the shell'));
  self.arguments._add ('help', new Command (function (callback) {
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

  self.options = {
    version: '0.0.1'
  };
  self.prompt = new Prompt ();
  self.extensions = [];
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

  var AutoComplete = require ('./lib/autocomplete.js');

  if (self.options.prompt) {
    self.prompt[0].message = self.options.prompt;
  }

  var history = [];
  var iterator = 0;

  process.stdin.setRawMode (true);
  self.uiPrompt     = {};
  self.autocomplete = new AutoComplete (self);

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
      self.uiPrompt.rl.write (null, {ctrl: true, name: 'u'});
      self.uiPrompt.rl.write (history[iterator]);
      break;
    }
    case 'down': {
      self.uiPrompt.rl.write (null, {ctrl: true, name: 'u'});
      if (iterator < history.length - 1) {
        ++iterator;
        self.uiPrompt.rl.write (history[iterator]);
      } else {
        iterator = history.length;
      }
      break;
    }
    /* Command auto-completion */
    case 'tab': {
      self.autocomplete.begin ();
      break;
    }
    }
  });

  var inquirerCallback = null;
  var inquirerPrompt   = self.prompt;

  async.forever (function (next) {
    self.uiPrompt = inquirer.prompt (inquirerPrompt, function (answers) {
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

  program.version (self.options.version);

  Object.keys (Object.getPrototypeOf (self.arguments)).forEach (function (fct) {
    if (self.arguments.hasOwnProperty (fct) || /^_/.test (fct) || self.arguments[fct].isBuiltIn ()) {
      return;
    }

    var params = self.arguments[fct].params ();

    switch (self.arguments[fct].type ()) {
    case 'option': {
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
    case 'command': {
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
            if (!data || !self.arguments[fct].isWizard ()) {
              return;
            }

            /* Start the wizard. */
            inquirer.prompt (data, function (answers) {
              wizardCallback (answers);
            });
          }, values);
        });
      return;
    }
    default: {
      callback ('item ' + fct + ' is ' + self.arguments[fct].type () +
                ' but a command or an option was expected');
      return;
    }
    }
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
 * @param {string} shellExt - Path on the shell extension file.
 * @param {function(err)} callback
 */
ShellCraft.prototype.registerExtension = function (shellExt, callback) {
  var self = this;
  var ext = require (shellExt);

  var Extension = require ('./lib/extension.js');
  var extension = new Extension (self);

  ext.register (extension, function (err) {
    if (!err) {
      self.extensions.push (ext);
      if (self.autocomplete) {
        self.autocomplete.reload ();
      }
    }

    if (callback) {
      callback (err);
    }
  });
};

/**
 * Begins the Shell or the CLI accordingly to the provided arguments.
 *
 * @param {Object} options
 * @param {function(err, results)} callback
 */
ShellCraft.prototype.begin = function (options, callback) {
  var self = this;
  self.options = options;

  /* Run in command line. */
  self.cli (function () {
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
