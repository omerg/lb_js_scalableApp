/*
 * test.lb.base.array.js - Unit Tests of lb.base.array module
 *
 * Author:    Eric Bréchemier <legalbox@eric.brechemier.name>
 * Copyright: Legal Box (c) 2010, All Rights Reserved
 * Version:   2010-05-17
 *
 * Based on Test Runner from bezen.org JavaScript library
 * CC-BY: Eric Bréchemier - http://bezen.org/javascript/
 */

/*requires lb.base.array.js */
/*requires bezen.assert.js */
/*requires bezen.object.js */
/*requires bezen.testrunner.js */
/*jslint nomen:false, white:false, onevar:false, plusplus:false, evil:true */
/*global lb, bezen, window */
(function() {
  // Builder of
  // Closure object for Test of lb.base.array

  // Define aliases
  var assert = bezen.assert,
      object = bezen.object,
      testrunner = bezen.testrunner;

  function testNamespace(){

    assert.isTrue( object.exists(window,'lb','base','array'),
                                      "lb.base.array namespace was not found");
  }

  function testEmpty(){
    var ut = lb.base.array.empty;

    var array = ['a',2,/3/];
    ut(array);
    assert.arrayEquals(array, [],           "array now expected to be empty");
  }

  function testCopy(){
    var ut = lb.base.array.copy;

    var object = {id: 42};
    var array = ['a', 2, object];

    assert.arrayEquals( ut(array), ['a', 2, object],
                                                    "copy of array expected");
  }

  function testToArray(){
    var ut = lb.base.array.toArray;

    var three = {id:42};
    (function(a,b,c){
        var args = ut(arguments);
        assert.arrayEquals( args, [1,'two',three],
                 "arguments expected to be converted to an equivalent array");
    }(1,'two',three));
  }

  var tests = {
    testNamespace: testNamespace,
    testEmpty: testEmpty,
    testCopy: testCopy,
    testToArray: testToArray
  };

  testrunner.define(tests, "lb.base.array");
  return tests;

}());
