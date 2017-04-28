/* The author disclaims copyright to this source code.  In place of
 * a legal notice, here is a blessing:
 *
 *    May you do good and not evil.
 *    May you find forgiveness for yourself and forgive others.
 *    May you share freely, never taking more than you give.
 */

'use strict';

var path = require ('path');
var shellcraft = require ('../');

var options = {
  version: '0.0.1',
  prompt: 'orc>',
};
var shellExt = path.join (__dirname, 'myShellExtension.js');

shellcraft.registerExtension (shellExt, function () {
  shellcraft.begin (options, function (err, results) {
    if (results) {
      console.log (results);
    }
  });
});
