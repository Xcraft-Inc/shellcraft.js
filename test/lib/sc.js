'use strict';

var path = require ('path');
var shellcraft = require ('../../');

var ext = path.join (__dirname, './extensions.js');
shellcraft.registerExtension (ext, function () {
  shellcraft.begin ({}, function () {});
});
