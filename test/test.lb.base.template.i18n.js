/*
 * test.lb.base.template.i18n.js - Unit Tests of lb.base.template.i18n module
 *
 * Author:    Eric Bréchemier <legalbox@eric.brechemier.name>
 * Copyright: Legal Box (c) 2010, All Rights Reserved
 * License:   BSD License - http://creativecommons.org/licenses/BSD/
 * Version:   2010-12-29
 *
 * Based on Test Runner from bezen.org JavaScript library
 * CC-BY: Eric Bréchemier - http://bezen.org/javascript/
 */

/*requires lb.base.template.i18n.js */
/*jslint white:false, onevar:false, plusplus:false */
/*global lb, bezen, window */
(function() {
  // Builder of
  // Closure object for Test of lb.base.template.i18n

  // Define aliases
      /*requires bezen.assert.js */
  var assert = bezen.assert,
      /*requires bezen.object.js */
      object = bezen.object,
      /*requires bezen.testrunner.js */
      testrunner = bezen.testrunner,
      /*requires bezen.dom.js*/
      element = bezen.dom.element;

  function testNamespace(){

    assert.isTrue( object.exists(window,'lb','base','template','i18n'),
                            "lb.base.template.i18n namespace was not found");
  }

  function testFilterByLanguage(){
    var ut = lb.base.template.i18n.filterByLanguage;

    assert.equals( ut(), null, "no function expected for undefined language");
    assert.equals( ut(null), null,
                                    "no function expected for null language");
    assert.equals( ut({}), null,
                   "no function expected for language which is not a string");

    var filter = ut('fr-FR');
    assert.equals( typeof filter, 'function',     "function filter expected");

    var noLanguageElement = element('div');
    var emptyLangElement = element('div',{lang:''});
    var frenchElement = element('div',{lang:'fr'});
    var frenchFranceElement = element('div',{lang:'fr-FR'});
    var englishElement = element('div',{lang:'en'});
    var englishUKElement = element('div',{lang:'en-GB'});

    var context = {};
    filter(noLanguageElement,context);
    assert.objectEquals(context,{lbLang:''},
                              "empty language code expected (no language)");

    filter(emptyLangElement,context);
    assert.objectEquals(context,{lbLang:''},
                              "empty language code expected (no language)");

    filter(noLanguageElement,context);
    assert.objectEquals(context,{lbLang:''},
                      "empty language code expected (back to no language)");


    var attValue = 'Test Attribute Value';
    var textValue = 'Test Text Value';

    var node = element('div');
    var context = {};
    ut(node,{},context);
    assert.objectEquals(context,{}, "context missing");

    assert.fail("Missing tests: lbLowerCaseFilterLanguageCode must be added to context");
    assert.fail("Missing tests: lbLowerCaseLanguageCode must be added to context if missing");
    assert.fail("Missing tests: lbLowerCaseLanguageCode must be preserved when present");

    var frenchNode = element('div',{id:attValue,lang:'fr'},textValue);
    ut(
      frenchNode.getAttributeNode('id'),
      {},
      {lbFilterByLanguage:'en-GB'}
    );
    assert.equals( frenchNode.getAttribute('id'), attValue,
                               "attibute node expected to be left unchanged");

    ut(
      frenchNode.firstChild,
      {},
      {lbFilterByLanguage:'en-GB'}
    );
    assert.equals( frenchNode.innerHTML, textValue,
                                 "text node expected to be left unchanged");

    var parent = element('div',{},frenchNode);
    ut(
      frenchNode,
      {},
      {lbFilterByLanguage:'fr-FR'}
    );
    assert.equals( frenchNode.parentNode, parent,
             "element with language matching filter must be left in parent");

    ut(
      frenchNode,
      {},
      {lbFilterByLanguage:'en-GB'}
    );


    assert.fail("Missing tests: element with lang != filter is removed from parent");

    assert.fail("Missing tests: element with no inherited lang left in parent");
    assert.fail("Missing tests: element with inherited lang === filter is left in parent");
    assert.fail("Missing tests: element with inherited lang != filter is removed from parent");
  }

  var tests = {
    testNamespace: testNamespace,
    testFilterByLanguage: testFilterByLanguage
  };

  testrunner.define(tests, "lb.base.template.i18n");
  return tests;

}());