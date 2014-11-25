
# shellcraft.js
[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/Xcraft-Inc/shellcraft.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

IT'S WORK IN PROGRESS, DON'T USE IT IN PROD.

Simple shell for Node.js based on commander and inquirer.

## Documentation

### Installation

```shell
$ npm install shellcraft
```

### Hello, World

```javascript
var shellcraft = require ('shellcraft');

var options = {
  version: '0.1.0'
};

shellcraft.begin ({}, function (msg) {
  if (msg) {
    console.log (msg);
  }
});
```

### API

There are only two public API in order to play with shellcraft.

---
#### shellcraft.begin (options, callback)

✤ options

Some options are available through the `option` argument.

```javascript
options = {
  version: '0.1.0',
  prompt: '>'
}
```

The `version` is used by Commander with the `-V, --version` parameter.
The default prompt `>` can be changed by something else. But note that the
prompt will always begins by `? `, like for example:

```shell
? myprompt>
```

it's because Inquirer has already its own prompt and this one can not be changed
easily.

✤ callback (msg)

The callback is called when the shell or the CLI is terminated. Note that
currently the `msg` argument is not consistent between the CLI and the shell.
This behavior will change in the future.

##### Example

```javascript
shellcraft.begin ({
  version: '0.0.1',
  prompt: 'orc>'
}, function (err, results) {
  if (msg) {
    console.log (results);
  }
});
```

shell mode
```
$ node myShell.js
? orc> _
? orc> help
 exit     exit the shell
 help     list of commands
? orc> exit
good bye
$ _
```

CLI mode
```
$ node myShell.js -h

  Usage: myShell [options]

  Options:

    -h, --help         output usage information
    -V, --version      output the version number

$ _
```

---
#### shellcraft.registerExtension (shellExt, callback);

There are two builtin commands `help` and `exit`. For more commands you must
register one or more extensions. An extension must be "requirable" and must
export two functions (`register()` and `unregister()`).
An array of command definitions must be passed to the callback of the `register`
function.

✤ shellExt

The path on the `.js` file where the definitions are exported. The array of
commands must be described like this:

```javascript
[{
  name    : 'foo',                        /* command's name without space     */
  desc    : 'foo description',            /* command's description (for help) */
  options : {
    wizard : false,                        /* when it's need Inquirer         */
    params : {
      required: 'argName',                 /* a required argument             */
      optional: 'optionals...'             /* several optionals arguments     */
                                           /* do not append ... in order to   */
                                           /* limit to one optional argument  */
    }
  },
  handler : function (callback, args) {
    /*
     * callback (wizard, function (answers) {})
     *   Is called in order to return to the prompt (or end if CLI). The wizard
     *   argument must be used only in order to process an Inquirer definition
     *   in the shell (or the CLI). Otherwise you must call the callback without
     *   arguments.
     *   The Inquirer answers are retrieved with the second argument.
     *
     * args
     *   Are the arguments provided with the command.
     */
  }
}]
```

Your shell extension must provide two methods, `register` and `unregister`
functions.

✤ callback ()

The callback is called as soon as the extension is registered.

##### Example

`myShellExtension.js`

```javascript
'use strict';

var cmd = {};

cmd.hello = function (callback, args) {
  console.log ('Hello, ' + args.join (' '));
  callback ();
};

cmd.wizard = function (callback) {
  var wizard = [{
    /* Inquirer definition... */
    type: 'input',
    name: 'zog',
    message: 'tell zog'
  }];

  callback (wizard, function (answers) {
    /* stuff on answers */
    if (answers.zog === 'zog') {
      console.log ('zog zog');
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

exports.register = function (callback) {
  var commands = [{
    name    : 'hello',
    desc    : 'print Hello, John',
    options : {
      wizard : false,
      params : {
        required: 'name',
        optional: 'etc...'
      }
    },
    handler : cmd.hello
  }, {
    name    : 'wizard',
    desc    : 'begins a wizard',
    options : {
      wizard : true
      },
      handler : cmd.wizard
      }];

      callback (null, commands);
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

shell mode
```
$ node myShell.js
? orc> _
? orc> help
 exit                    exit the shell
 help                    list of commands
 hello <name> [etc...]   print Hello, John
 wizard                  begins a wizard
? orc> hello Tux
Hello, Tux
? orc> exit
good bye
$ _
```

CLI mode
```
$ node myShell.js -h

  Usage: myShell [options] [command]

  Commands:

    hello <name> [etc...]  print Hello, John
    wizard                 begins a wizard

  Options:

    -h, --help     output usage information
    -V, --version  output the version number

$ _
$ node myShell.js hello Alice
Hello, Alice
$ _
```

# License

The MIT License (MIT)

Copyright (c) 2014 Xcraft

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
