'use strict';

var Immutable = require('immutable');

var isMapLike = function(obj){ return Immutable.Iterable.isKeyed(obj) || Immutable.Record.isRecord(obj); };
var isIndexed = function(obj) { return Immutable.Iterable.isIndexed(obj); };

var op = function(operation, path, value){
  if(operation === 'remove') { return { op: operation, path: path }; }

  return { op: operation, path: path, value: value };
};

module.exports = {
  isMapLike: isMapLike,
  isIndexed: isIndexed,
  op: op
};