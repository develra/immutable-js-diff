'use strict';

var Immutable = require('immutable');
var utils = require('./utils');
var lcs = require('./lcs');
var path = require('./path');
var concatPath = path.concat,
                  escape = path.escape,
                  op = utils.op,
                  isMapLike = utils.isMapLike,
                  isIndexed = utils.isIndexed;

var mapDiff = function(a, b, p){
  var ops = [];
  var path = p || '';

  if(Immutable.is(a, b) || (a == b == null)){ return ops; }

  var areLists = isIndexed(a) && isIndexed(b);
  var lastKey = null;
  var removeKey = null

  // If a is a record, convert it to a squence so
  // it can be iterated as a map.
  var aIt = a.forEach ? a : a.toSeq ? a.toSeq() : a;

  if(aIt.forEach){
    aIt.forEach(function(aValue, aKey){
      if(b.has(aKey)){
        if(isMapLike(aValue) && isMapLike(b.get(aKey))){
          ops = ops.concat(mapDiff(aValue, b.get(aKey), concatPath(path, escape(aKey))));
        }
        else if(isIndexed(b.get(aKey)) && isIndexed(aValue)){
          ops = ops.concat(sequenceDiff(aValue, b.get(aKey), concatPath(path, escape(aKey))));
        }
        else {
          var bValue = b.get ? b.get(aKey) : b;
          var areDifferentValues = (aValue !== bValue);
          if (areDifferentValues) {
            ops.push(op('replace', concatPath(path, escape(aKey)), bValue));
          }
        }
      }
      else {
        if(areLists){
          removeKey = (lastKey != null && (lastKey+1) === aKey) ? removeKey : aKey;
          ops.push( op('remove', concatPath(path, escape(removeKey))) );
          lastKey = aKey;
        }
        else{
          ops.push( op('remove', concatPath(path, escape(aKey))) );
        }

      }
    });
  }

  var bIt = b.forEach ? b : b.toSeq ? b.toSeq() : b;

  bIt.forEach(function(bValue, bKey){
    if(a.has && !a.has(bKey)){
      ops.push(op('add', concatPath(path, escape(bKey)), bValue));
    }
  });

  return ops;
};

var sequenceDiff = function (a, b, p) {
  var ops = [];
  var path = p || '';
  if(Immutable.is(a, b) || (a == b == null)){ return ops; }
  if((a.count() + 1) * (b.count() + 1) >= 10000 ) { return mapDiff(a, b, p); }

  var lcsDiff = lcs.diff(a, b);

  var pathIndex = 0;

  lcsDiff.forEach(function (diff) {
    if(diff.op === '='){ pathIndex++; }
    else if(diff.op === '!='){
      if(isMapLike(diff.val) && isMapLike(diff.newVal)){
        var mapDiffs = mapDiff(diff.val, diff.newVal, concatPath(path, pathIndex));
        ops = ops.concat(mapDiffs);
      }
      else{
        ops.push(op('replace', concatPath(path, pathIndex), diff.newVal));
      }
      pathIndex++;
    }
    else if(diff.op === '+'){
      ops.push(op('add', concatPath(path, pathIndex), diff.val));
      pathIndex++;
    }
    else if(diff.op === '-'){ ops.push(op('remove', concatPath(path, pathIndex))); }
  });

  return ops;
};

var primitiveTypeDiff = function (a, b, p) {
  var path = p || '';
  if(a === b){ return []; }
  else{
    return [ op('replace', concatPath(path, ''), b) ];
  }
};

var fromJS = function(value){
  return Immutable.fromJS(value).map(op => (op.get("isImmutableObject") ? op.update("value", v => v.toJS()) : op).delete("isImmutableObject"));
};

var done = false;
var diff = function(a, b, p){
  if(Immutable.is(a, b)){ return Immutable.List(); }
  if(a != b && (a == null || b == null)){ return fromJS([op('replace', '/', b)]); }
  if(isIndexed(a) && isIndexed(b)){
    return fromJS(sequenceDiff(a, b));
  }
  else if(isMapLike(a) && isMapLike(b)){
    return fromJS(mapDiff(a, b));
  }
  else{
    return fromJS(primitiveTypeDiff(a, b, p));
  }
};

module.exports = diff;
