'use strict';

var diff = require('../src/diff');
var Immutable = require('immutable');
var JSC = require('jscheck');
var assert = require('assert');

describe('Record diff', function(){
  var failure = null;

  before(function(){
    JSC.on_report(function(report){
      console.log(report);
    });

    JSC.on_fail(function(jsc_failure){
      failure = jsc_failure;
    });
  });

  afterEach(function () {
    if(failure){
      console.error(failure);
      throw failure;
    }
  });

  it('It properly diffs records with nested objects', function() {
      var expected = "ofc";
      var R = Immutable.Record({kaiser: {bueno: true}});
      console.log("marker");
      var patch = diff(R(), R({kaiser: {bueno: expected}}));
      assert(patch.getIn(["0", "value"]).bueno === expected, "JSON objects must be stored as plain objects.");
  });
});