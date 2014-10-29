
# shellcraft.js

IT'S WORK IN PROGRESS, DON'T USE IT IN PROD.

Simple shell for Node.js based on commander and inquirer.

## Documentation

### Installation

```shell
$ npm install shellcraft
```

### How to use

```javascript
var shellcraft = require ('shellcraft');

var options = {
  version: '0.1.0',
  prompt: '$'
};

shellcraft.begin (options, function (msg) {
  if (msg) {
    console.log (msg);
  }
});
```

### Advanced use

TODO
