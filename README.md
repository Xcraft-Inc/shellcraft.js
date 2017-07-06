
# [shellcraft.js](https://www.npmjs.org/package/shellcraft)

[![npm version](https://badge.fury.io/js/shellcraft.svg)](http://badge.fury.io/js/shellcraft)
[![dependencies](https://david-dm.org/Xcraft-Inc/shellcraft.js.png?theme=shields.io)](https://david-dm.org/Xcraft-Inc/shellcraft.js)
[![Build Status](https://travis-ci.org/Xcraft-Inc/shellcraft.js.svg?branch=master)](https://travis-ci.org/Xcraft-Inc/shellcraft.js)
[![gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/Xcraft-Inc/shellcraft.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Simple CLI and shell for Node.js based on [commander][1] and [inquirer][2].

This module provides a way in order to use *commander* and *inquirer* together.
There are a CLI and a shell mode, and the same commands can be used everywhere.

**shellcraft.js** supports the command history and the auto-completion (in shell
mode).

## Documentation

### Installation

[![NPM Badge](https://nodei.co/npm/shellcraft.png?downloads=true&stars=true)](https://npmjs.org/package/shellcraft)

```shell
$ npm install shellcraft
```

### Hello, World

```javascript
var shellcraft = require ('shellcraft');

var options = {
  version: '0.1.0'
};

shellcraft.begin (options, function (err, results) {
  if (results) {
    console.log (results);
  }
});
```

### API

There are only two public API in order to play with shellcraft.

---
#### shellcraft.begin (options, callback)

✤ options

```javascript
options = {
  version: '0.1.0',
  prompt: '>',
  promptFixed: false
}
```

The `version` is used by Commander with the `-V, --version` parameter.
The default prompt `>` can be changed by something else, like for example:

```shell
myprompt>
```

The `promptFixed` option is experimental and disabled by default. The purpose
is to keep the prompt at the bottom even if async `console.log` outputs are
used. In other words, (most) outputs are put before the prompt. Outputs via
`process.stdout.write` (or `stderr`) are not handled by this option.

✤ callback (results)

The callback is called when the shell or the CLI is terminated. Note that
currently the `results` argument is not consistent between the CLI and the shell
mode. This behavior will change in the future.

##### Example

```javascript
shellcraft.begin ({
  version: '0.0.1',
  prompt: 'orc>'
}, function (err, results) {
  if (results) {
    console.log (results);
  }
});
```

shell mode
```
$ node myShell.js
orc> _
orc> help
 exit     exit the shell
 help     list of commands
 scope    change scope

orc> exit
$ _
```

CLI mode
```
$ node myShell.js -h

  Usage: myShell [options]

  Options:

    -h, --help         output usage information
    -V, --version      output the version number
    -s, --scoped       include scoped commands (CLI only)

$ _
```

---
#### shellcraft.registerExtension (shellExt, callback);

There are two builtin commands `help` and `exit`. For more commands you must
register one or more extensions. An extension must be "requirable" and must
export two functions (`register()` and `unregister()`).

✤ shellExt

The path on the `.js` file where the `register` and `unregister` methods are
exported. An `extension` argument is passed with the `register` call. This
object has four methods, `command`, `option`, `remove` and `reload`. It looks
like the *commander* API in some ways.

```javascript
extension
  .command ('foo', 'foo description', options, function (callback, args) {
    /*
     * callback (wizard, function (answers) {})
     *   Is called in order to return to the prompt (or exit if CLI). The wizard
     *   argument must be used only in order to process an Inquirer definition
     *   in the shell (or the CLI). Otherwise you must call the callback without
     *   arguments.
     *   The Inquirer answers are retrieved with the second argument.
     *
     * args
     *   Are the arguments provided with the command.
     */
  })
  .option ('-f, --foo', 'foo description', options, function (callback, args) {
    /*
     * callback ()
     *
     * args
     *   This array can not have more than one item.
     */
  });

/* Remove a specific command or option */
extension.remove ('foo');

/* Reload for autocomplete (for example after removing a command) */
extension.reload ();
```

The options can be (for `command`):
```javascript
options : {
  wizard : false,              /* when it needs Inquirer          */
  params : {
    scope: 'goblin',           /* override global scope filter    */
    required: 'argName',       /* a required argument             */
    optional: 'optionals...'   /* several optionals arguments     */
                               /* do not append ... in order to   */
                               /* limit to one optional argument  */
  }
}
```

It's possible to have an array of `required` or `optional` arguments,
for example:

```javascript
options : {
  params : {
    required: ['arg1', 'arg2'],
    optional: ['opt1', 'opt2', 'opts...']
  }
}
```

The options can be (for `option`):
```javascript
options : {
  params : {
    required: 'argName',       /* a required argument             */
  }
}
```

✤ callback ()

The callback must be called when the extension is registered.

##### Example

`myShellExtension.js`

```javascript
'use strict';

var zog = 'zog';

var cmd = {};
var opt = {};

cmd.hello = function (callback, args) {
  console.log (zog + ' tells "Hello, ' + args.join (' ') + '"');
  callback ();
};

cmd.wizard = function (callback) {
  var wizard = [{
    /* Inquirer definition... */
    type: 'input',
    name: 'zog',
    message: 'tell ' + zog
  }];

  callback (wizard, function (answers) {
    /* stuff on answers */
    if (answers.zog === zog) {
      console.log (zog + ' ' + zog);
    } else {
      console.log ('lokthar?');
    }

    /*
     * You can return false if you must provide several wizard with only
     * one call to this command handler.
     * You can call callback () without argument in order to return to the
     * prompt instead of returning true.
     */
    return true;
  });
};

opt.foobar = function (callback, args) {
  if (args) {
    zog = args[0];
  } else {
    zog = 'lokthar';
  }
  callback ();
};

exports.register = function (extension, callback) {
  extension
    .command ('hello', 'print Hello, John', {
      wizard: false,
      params: {
        required: 'name',
        optional: 'etc...'
      }
    }, cmd.hello)
    .command ('wizard', 'begins a wizard', {
      wizard: true,
      scope: 'warcraft'
    }, cmd.wizard)
    .option ('-f, --foobar', 'zog is foobar', {
      params: {
        required: 'who'
      }
    }, opt.foobar);

  callback ();
};

exports.unregister = function (callback) {
  /* internal stuff */
  callback ();
};
```

`myShell.js`

```javascript
'use strict';

var path       = require ('path');
var shellcraft = require ('../');

var options = {
  version: '0.0.1',
  prompt: 'orc>'
};
var shellExt = path.join (__dirname, 'myShellExtension.js');

shellcraft.registerExtension (shellExt, function () {
  shellcraft.begin (options, function (err, results) {
    if (results) {
      console.log (results);
    }
  });
});
```

---

shell mode
```
$ node myShell.js
orc> _
orc> help
 exit                    exit the shell
 help                    list of commands
 scope                   change scope (warcraft)
 hello <name> [etc...]   print Hello, John

orc> hello Tux
zog tells "Hello, Tux"
orc> exit
$ _
```

CLI mode
```
$ node myShell.js -h

  Usage: myShell [options] [command]


  Commands:

    *
    hello <name> [etc...]  print Hello, John

  Options:

    -h, --help          output usage information
    -V, --version       output the version number
    -s, --scoped        include scoped commands (CLI only)
    -f, --foobar <who>  zog is foobar

$ _
$ node myShell.js hello Alice
zog tells "Hello, Alice"
$ node myShell.js -f Bob hello Alice
Bob tells "Hello, Alice"
$ _
```

Note that the commands which are in a different scope (like `wizard` in this
example), are not shown in the global help output.

In order to see all commands, you must pass the `-s, --scope` argument:

```
$ node examples/myShell -sh

  Usage: myShell [options] [command]


  Commands:

    *
    hello <name> [etc...]  print Hello, John
    warcraft@wizard        begins a wizard

  Options:

    -h, --help          output usage information
    -V, --version       output the version number
    -s, --scoped        include scoped commands (CLI only)
    -f, --foobar <who>  zog is foobar

$ _
```

# License

```
The MIT License (MIT)

Copyright (c) 2014-2016 Xcraft <mathieu@schroetersa.ch>  
Copyright (c) 2015      Xcraft <sam@loup.io>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```


[1]: https://www.npmjs.org/package/commander
[2]: https://www.npmjs.org/package/inquirer
