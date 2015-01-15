
# [shellcraft.js](https://www.npmjs.org/package/shellcraft)

[![npm version](https://badge.fury.io/js/shellcraft.svg)](http://badge.fury.io/js/shellcraft)
[![dependencies](https://david-dm.org/Xcraft-Inc/shellcraft.js.png?theme=shields.io)](https://david-dm.org/Xcraft-Inc/shellcraft.js)
[![gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/Xcraft-Inc/shellcraft.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Simple CLI and shell for Node.js based on [commander](https://www.npmjs.org/package/commander)
and [inquirer](https://www.npmjs.org/package/inquirer).

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
 scope    change scope
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

✤ shellExt

The path on the `.js` file where the `register` and `unregister` methods are
exported. An `extension` argument is passed with the `register` call. This
object has two methods, `command` and `option`. It looks like the *commander*
API.

```javascript
extension
  .command ('foo', 'foo description', options, function (callback, args) {
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
  })
  .option ('-f, --foo', 'foo description', options, function (callback, args) {
    /*
     * callback ()
     *
     * args
     *   This array can not have more than one element.
     */
  });
```

The options can be (for `command`):
```javascript
options : {
  wizard : false,              /* when it's need Inquirer         */
  params : {
    scope: 'goblin',           /* override global scope filter    */
    required: 'argName',       /* a required argument             */
    optional: 'optionals...'   /* several optionals arguments     */
                               /* do not append ... in order to   */
                               /* limit to one optional argument  */
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

The callback must be called as soon as the extension is registered.

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
      wizard: true
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

***

shell mode
```
$ node myShell.js
? orc> _
? orc> help
 exit                    exit the shell
 help                    list of commands
 scope                   change scope
 hello <name> [etc...]   print Hello, John
 wizard                  begins a wizard
? orc> hello Tux
zog tells "Hello, Tux"
? orc> exit
good bye
$ _
```

CLI mode
```
$ node myShell.js -h

  Usage: myShell [options] [command]

  Commands:

    *
    hello <name> [etc...]  print Hello, John
    wizard                 begins a wizard

  Options:

    -h, --help          output usage information
    -V, --version       output the version number
    -f, --foobar <who>  zog is foobar

$ _
$ node myShell.js hello Alice
zog tells "Hello, Alice"
$ node myShell.js -f Bob hello Alice
Bob tells "Hello, Alice"
$ _
```

# License

The MIT License (MIT)

Copyright (c) 2014-2015 Xcraft <mathieu@schroetersa.ch>
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
