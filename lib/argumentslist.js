'use strict';

/**
 * ArgumentsList constructor.
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

exports = module.exports = ArgumentsList;
