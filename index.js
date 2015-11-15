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

var async    = require ('async');
var inquirer = require ('inquirer');

var Command  = require ('./lib/command.js');


/**
 * ShellCraft constructor.
 */
function ShellCraft () {
  var self = this;

  var ArgumentsList = require ('./lib/argumentslist.js');
  var Prompt        = require ('./lib/prompt.js');

  self._exit = false;
  self._shell = true; /* open the shell be default */
  self._scope = 'global';

  self.arguments = new ArgumentsList ();
  self.arguments._add ('exit', new Command (function (callback) {
    self._exit = true;
    if (callback) {
      callback ();
    }
  }, {builtIn: true, scope: '*'}, 'exit the shell'));

  self.arguments._add ('help', new Command (function (callback) {
    Object.keys (Object.getPrototypeOf (self.arguments)).forEach (function (fct) {
      if (!self.arguments.hasOwnProperty (fct) &&
          !/^_/.test (fct) &&
          self.arguments[fct].type () === 'command' &&
          self.arguments[fct].isScoped (self._scope)) {
        console.log (self.arguments[fct].help ());
      }
    });

    console.log ('');

    if (callback) {
      callback ();
    }
  }, {builtIn: true, scope: '*'}, 'list of commands'));

  self.arguments._add ('scope', new Command (function (callback, scope) {
    self._scope = scope[0] || 'global';
    self.autocomplete.reload ();
    self.prompt.setScope (self._scope !== 'global' ? scope : '');

    if (callback) {
      callback ();
    }
  }, {builtIn: true, scope: '*'}, function () {
    var help = 'change scope';
    var scopes = [];

    /* Look for all available scopes */
    Object.keys (Object.getPrototypeOf (self.arguments)).forEach (function (fct) {
      if (!self.arguments.hasOwnProperty (fct) &&
        !/^_/.test (fct) &&
        self.arguments[fct].type () === 'command') {
        var scope = self.arguments[fct].scope ();
        if (scope === '*' || scope === 'global') {
          return;
        }

        if (scopes.indexOf (scope) === -1) {
          scopes.push (self.arguments[fct].scope ());
        }
      }
    });

    var list = scopes.length ? ' (' + scopes.join (', ') + ')' : '';
    return help + list;
  }));

  self.options = {
    version: '0.0.1'
  };
  self.prompt = new Prompt ();
  self.extensions = {};

  /* HACK inquirer prefix */
  Object.keys (inquirer.prompt.prompts).forEach (function (prompt) {
    inquirer.prompt.prompts[prompt].prototype.prefix = function (str) {
      return str;
    };
  });
}

/**
 * Check if we must exit the shell.
 *
 * API private
 *
 * @returns {boolean} Exit status.
 */
ShellCraft.prototype.isExit = function () {
  return this._exit;
};

/**
 * Start the Shell interface.
 *
 * API private
 *
 * @param {function(err, results)} callback
 */
ShellCraft.prototype.shell = function (callback) {
  var self = this;

  var util = require ('util');
  var AutoComplete = require ('./lib/autocomplete.js');

  if (self.options.prompt) {
    self.prompt.setMessage (self.options.prompt);
  }

  var history = [];
  var iterator = 0;

  process.stdin.setRawMode (true);
  self.uiPrompt     = {};
  self.autocomplete = new AutoComplete (self);

  /* Try to keep the prompt always at the bottom.
   * This feature is experimental and mostly based on:
   *   http://stackoverflow.com/questions/12672193/fixed-position-command-prompt-in-node-js
   */
  var promptFixed = function () {
    var con = {};
    con.log   = console.log;
    con.warn  = console.warn;
    con.info  = console.info;
    con.error = console.error;

    var fu = function (type, args) {
      if (!self.uiPrompt.rl) {
        return con[type].apply (con, args);
      }

      var t = Math.ceil ((self.uiPrompt.rl.line.length + 3) / process.stdout.columns);
      var text = util.format.apply (console, args);

      self.uiPrompt.rl.output.write ('\n\x1B[' + t + 'A\x1B[0J');
      self.uiPrompt.rl.output.write (text + '\n');
      self.uiPrompt.rl.output.write (new Array (t).join ('\n\x1B[E'));
      self.uiPrompt.rl._refreshLine ();
    };

    console.log = function () {
      fu ('log', arguments);
    };
    console.warn = function () {
      fu ('warn', arguments);
    };
    console.info = function () {
      fu ('info', arguments);
    };
    console.error = function () {
      fu ('error', arguments);
    };
  };

  if (self.options.promptFixed) {
    promptFixed ();
  }

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
  var inquirerPrompt   = self.prompt.getInquirer ();

  var prompt = inquirer.createPromptModule ({
    completer: function (line) {
      return [[], line];
    }
  });

  async.forever (function (next) {
    self.uiPrompt = prompt (inquirerPrompt, function (answers) {
      /*
       * Special handling when the command returns an Inquirer definition. In
       * this case we must return the answers to the caller.
       */
      if (inquirerCallback) {
        var returnToPrompt = inquirerCallback (answers);
        if (returnToPrompt) {
          inquirerCallback = null;
          inquirerPrompt   = self.prompt.getInquirer ();
          next ();
        }
        return;
      }

      /*
       * Normal shell handling for the commands.
       */
      var cmdArgs = answers.command
                      .trim ()
                      .replace (/[ ]{2,}/g, ' ')
                      .split (' ');

      var cmd = cmdArgs[0];
      cmdArgs.shift ();

      if (cmd.length && answers.command !== history[history.length - 1]) {
        history.push (answers.command);
      }
      iterator = history.length;

      try {
        if (!cmd.length) {
          throw new Error ();
        }

        if (!Object.getPrototypeOf (self.arguments).hasOwnProperty (cmd) || /^_/.test (cmd)) {
          throw new Error ('command ' + cmd + ' unknown');
        }

        if (self.arguments[cmd].type () !== 'command' || !self.arguments[cmd].isScoped (self._scope)) {
          throw new Error (cmd + ' is not a command');
        }

        /* Check for required argument. */
        var required = self.arguments[cmd].hasRequired ();
        if (required && (!cmdArgs.length || !cmdArgs[0].length)) {
          throw new Error ('missing required argument `' + required + '\'');
        }

        self.arguments[cmd].call (function (data, wizardCallback) {
          /* The next prompt we must start the wizard provided by the client. */
          if (data) {
            if (self.arguments[cmd].isWizard ()) {
              inquirerPrompt = data;
              inquirerCallback = wizardCallback;
            }
          } else {
            inquirerPrompt   = self.prompt.getInquirer ();
            inquirerCallback = null;
          }
          next (self.isExit () ? 'good bye' : null);
        }, cmdArgs);
      } catch (ex) {
        if (ex.message.length) {
          console.log (ex.message);
        }
        next ();
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
 * API private
 *
 * @param {function(results)} callback
 */
ShellCraft.prototype.cli = function (callback) {
  var self = this;
  var scoped = false;
  var program = require ('commander');

  program.version (self.options.version);

  program
    .command ('*')
    .description ('')
    .action (function (cmd) {
      self._shell = false;
      console.error ('command ' + cmd + ' unknown');
      if (callback) {
        callback ();
      }
    });

  /* Include all scoped commands. */
  program.option ('-s, --scoped', 'include scoped commands (CLI only)');

  var opts = program.normalize (process.argv.slice (2));
  if (opts.indexOf ('-s') !== -1 || opts.indexOf ('--scoped') !== -1) {
    scoped = true;
  }

  Object.keys (Object.getPrototypeOf (self.arguments)).forEach (function (fct) {
    if (/^_/.test (fct) ||
        self.arguments[fct].isBuiltIn () ||
        (!scoped && !self.arguments[fct].isScoped (self._scope))) {
      return;
    }

    var params = self.arguments[fct].params ();
    var scope  = self.arguments[fct].scope ();

    switch (scope) {
    case '*':
    case 'global': {
      scope = '';
      break;
    }
    default: {
      scope += '@';
      break;
    }
    }

    switch (self.arguments[fct].type ()) {
    case 'option': {
      program
        .option (fct + params, self.arguments[fct].help (true), function () {
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
        .command (scope + fct + params)
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
              if (callback) {
                callback ();
              }
              return;
            }

            /* Start the wizard. */
            inquirer.prompt (data, function (answers) {
              var stop = wizardCallback (answers);
              if (stop && callback) {
                callback ();
              }
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

  if (!program.args.length && callback) {
    callback ();
  }
};

/**
 * Close the Command Line Interface (CLI) or the shell.
 *
 * API private
 *
 * @param {function(err)} callback
 */
ShellCraft.prototype.shutdown = function (callback) {
  var self = this;
  async.each (Object.keys (self.extensions), function (ext, callback) {
    self.extensions[ext].unregister (callback);
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
  var path = require ('path');
  var ext  = require (shellExt);

  var Extension = require ('./lib/extension.js');
  var extension = new Extension (self);

  ext.register (extension, function (err) {
    if (!err) {
      self.extensions[path.resolve (shellExt)] = ext;
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

  /* HACK: This is ugly but the problem comes from Commander which is abusing
   * of process.exit.
   */
  var processExit = process.exit;
  process.exit = function (code) {
    self._shell = false;

    /* HACK: Commander considers that -h, --help is not recognized.
     * It's related to the abuse of process.exit.
     */
    console.error = function () {};

    self.shutdown (function () {
      processExit (code);
    });
  };

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
