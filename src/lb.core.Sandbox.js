/*
 * Namespace: lb.core.Sandbox
 * Sandbox for Modules of Legal Box Scalable JavaScript Application
 *
 * A new instance of Sandbox gets attributed to each instance of Module. It
 * acts both as a proxy and a facade to the application core, restricting
 * modifications to the box assigned to the module, an HTML element which
 * encloses the module.
 *
 * The methods related to the module itself are defined on the Sandbox. Other
 * methods are defined by separate plugin modules.
 *
 * Module (sandbox):
 *   - <sandbox.getId([localId]):string>
 *   - <sandbox.getBox(createIfMissing): DOM Element>
 *   - <sandbox.isInBox(element): boolean>
 *
 * Cascading Style Sheets (sandbox.css, defined by <lb.core.plugins.css>):
 *   - <lb.core.plugins.css.sandbox.css.getClasses(element): object>
 *   - <lb.core.plugins.css.sandbox.css.addClass(element,name)>
 *   - <lb.core.plugins.css.sandbox.css.removeClass(element,name)>
 *
 * Document Object Model (sandbox.dom, defined by <lb.core.plugins.dom>):
 *   - <lb.core.plugins.dom.sandbox.dom.$(localId): DOM Element>
 *   - <lb.core.plugins.dom.sandbox.dom.element(name[,attributes[,childNodes]]): DOM Element>
 *   - <lb.core.plugins.dom.sandbox.dom.fireEvent(element,type[,properties]): DOM Event>
 *   - <lb.core.plugins.dom.sandbox.dom.cancelEvent(event)>
 *   - <lb.core.plugins.dom.sandbox.dom.getListeners(): array>
 *   - <lb.core.plugins.dom.sandbox.dom.addListener(element,type,callback): Listener>
 *   - <lb.core.plugins.dom.sandbox.dom.removeListener(listener)>
 *   - <lb.core.plugins.dom.sandbox.dom.removeAllListeners()>
 *
 * Events for loose coupling with other modules (sandbox.events, defined by <lb.core.plugins.events>):
 *   - <lb.core.plugins.events.sandbox.events.subscribe(filter,callback)>
 *   - <lb.core.plugins.events.sandbox.events.unsubscribe(filter)>
 *   - <lb.core.plugins.events.sandbox.events.publish(event)>
 *
 * Internationalization through language properties (sandbox.i18n, defined by <lb.core.plugins.i18n>):
 *   - <lb.core.plugins.i18n.sandbox.i18n.getLanguageList(): array of strings>
 *   - <lb.core.plugins.i18n.sandbox.i18n.getSelectedLanguage(): string>
 *   - <lb.core.plugins.i18n.sandbox.i18n.selectLanguage(languageCode)>
 *   - <lb.core.plugins.i18n.sandbox.i18n.addLanguageProperties(languageCode,languageProperties)>
 *   - <lb.core.plugins.i18n.sandbox.i18n.get(key[,languageCode]): any>
 *   - <lb.core.plugins.i18n.sandbox.i18n.getString(key[,data[,languageCode]]): string>
 *   - <lb.core.plugins.i18n.sandbox.i18n.filterHtml(htmlNode[,data[,languageCode]])>
 *
 * Asynchronous communication with a remote server (sandbox.server, defined by <lb.core.plugins.server>):
 *   - <lb.core.plugins.server.sandbox.server.send(url,data,receive)>
 *
 * Uniform Resource Locator, local navigation (sandbox.url, defined by <lb.core.plugins.url>):
 *   - <lb.core.plugins.url.sandbox.url.getLocation(): object>
 *   - <lb.core.plugins.url.sandbox.url.setHash(hash)>
 *   - <lb.core.plugins.url.sandbox.url.onHashChange(callback)>
 *
 * General utilities (sandbox.utils):
 *   - <lb.core.plugins.utils.sandbox.utils.has(object,property[,...]): boolean>
 *   - <lb.core.plugins.utils.sandbox.utils.is([...,]value[,type]): boolean>
 *   - <lb.core.plugins.utils.sandbox.utils.getTimestamp(): number>
 *   - <lb.core.plugins.utils.sandbox.utils.setTimeout(callback,delay): number>
 *   - <lb.core.plugins.utils.sandbox.utils.clearTimeout(timeoutId)>
 *   - <lb.core.plugins.utils.sandbox.utils.trim(string): string>
 *   - <lb.core.plugins.utils.sandbox.utils.log(message)>
 *   - <lb.core.plugins.utils.sandbox.utils.confirm(message): boolean>
 *
 * The plugins are loaded by the Sandbox Builder. The sandbox API can be
 * customized by configuring a different sandbox builder to load additional or
 * alternative plugins. See <lb.core.plugins.builder> for details.
 *
 * Author:
 * Eric Bréchemier <legalbox@eric.brechemier.name>
 *
 * Copyright:
 * Legal-Box SAS (c) 2010-2011, All Rights Reserved
 *
 * License:
 * BSD License
 * http://creativecommons.org/licenses/BSD/
 *
 * Version:
 * 2011-04-26
 */
/*requires lb.core.js */
/*jslint white:false, plusplus:false */
/*global lb, document, window */
lb.core.Sandbox = function (id){
  // Function: new Sandbox(id): Sandbox
  // Constructor of a new Sandbox.
  //
  // Parameters:
  //   id - string, the identifier of the module, which is also the id of the 
  //        root HTML element for this module. If the element does not exist in
  //        the document, it will get created on the first call to getBox().
  //
  // Returns:
  //   object, the new instance of Sandbox

  // Define aliases
      /*requires lb.base.type.js */
  var is = lb.base.type.is,
      /*requires lb.base.object.js */
      has = lb.base.object.has,
      /*requires lb.base.array.js */
      removeAll = lb.base.array.removeAll,
      /*requires lb.base.dom.js */
      dom = lb.base.dom,
      /*requires lb.base.ajax.js */
      send = lb.base.ajax.send,
      /*requires lb.base.string.js */
      trim = lb.base.string.trim,
      /*requires lb.base.log.js */
      log = lb.base.log.print,
      /*requires lb.base.history.js */
      history = lb.base.history,
      setHash = history.setHash,
      /*requires lb.base.config.js */
      config = lb.base.config,
      /*requires lb.base.i18n.js */
      i18n = lb.base.i18n,
      /*requires lb.base.i18n.data.js */
      i18nData = i18n.data,
      /*requires lb.base.template.i18n.js */
      i18nTemplate = lb.base.template.i18n,
      /*requires lb.core.events.publisher.js */
      publisher = lb.core.events.publisher,
      /*requires lb.core.events.Subscriber.js */
      Subscriber = lb.core.events.Subscriber,

  // Private fields

    // object, the factory used to create DOM elements, listeners and events.
    // A custom factory can be configured by setting the property lbFactory.
    // Defaults to lb.base.dom.factory.
    /*requires lb.base.dom.factory.js */
    factory = config.getOption('lbFactory', lb.base.dom.factory),

    // DOM element, the root of the box, carrying the module identifier.
    // Used only in getBox(), to avoid multiple lookups of the same element.
    // Initialized on first call to getBox().
    box = null,

    // array, the set of Subscribers created for this module.
    // Kept locally for use in unsubscribe().
    subscribers = [],

    // array, the set of listeners created by this module
    // Kept for removeAllListeners().
    listeners = [],

    // function, the current listener set to onHashChange(), which will get
    // replaced in a new call to onHashChange().
    hashChangeCallback = null;

  function getId(localId){
    // Function: sandbox.getId([localId]): string
    // Get the identifier of the module, when optional parameter is omitted.
    // With optional parameter, get the full identifier corresponding to the
    // given local identifier.
    //
    // Parameter:
    //  localId - string, optional local identifier
    //
    // Returns:
    //   string, the identifier of the module, as provided in constructor,
    //   or the full identifier corresponding to given local identifier.
    //
    // Note:
    //   The full identifier is made of the module identifier, followed by the
    //   separator '.', followed by the local identifier.

    if ( has(localId) ) {
      return id+'.'+localId;
    } else {
      return id;
    }
  }

  function getBox(createIfMissing){
    // Function: sandbox.getBox(createIfMissing): DOM Element
    // Get the root HTML element for this module.
    //
    // Parameter:
    //   createIfMissing - boolean, optional, defaults to true,
    //                     Whether to create the box element if it is not found
    //                     in the document.
    // Note:
    //   In case createIfMissing is true (by default) and no HTML element is
    //   found in the document with the module id, a new div element is created
    //   with this id and inserted last in the document body.
    //
    // Returns:
    //   * DOM Element, the HTML element corresponding to the module id,
    //   * or null, in case createIfMissing is false and the element is missing
    createIfMissing = has(createIfMissing)? createIfMissing : true;

    if ( has(box) ) {
      return box;
    }
    box = dom.$(id);
    if ( !has(box) && createIfMissing){
      log('Warning: no element "'+id+
          '" found in box. Will be created at end of body.');
      box = factory.createElement('div',{'id': id});
      document.body.appendChild(box);
    }
    return box;
  }

  function isInBox(element){
    // Function: sandbox.isInBox(element): boolean
    // Check whether the given element is in the box.
    //
    // Parameter:
    //   element - DOM Element, an element
    //
    // Returns:
    //   * true if the element is a descendant of or the root of the box itself
    //   * false otherwise

    // Note:
    // if optimization or reuse is needed, isInBox() could rely on a new method
    // to add to base DOM API: contains(ancestorElement,descendantElement)
    // (available as goog.dom.contains(parent,descendant) in Closure library)

    var ancestor = element;
    while ( has(ancestor) ) {
      // TODO: return false when a document node is reached without passing by
      //       the root of the box

      // TODO: allow document-fragment or null as last ancestor
      //       for nodes not/no longer part of the DOM

      // box must be found in ancestors or self
      if ( ancestor === getBox(false) ) {
        return true;
      }
      ancestor = ancestor.parentNode;
    }
    return false;
  }

  function $(localId){
    // Function: dom.$(localId): DOM Element
    // Get the element of the box with given local identifier.
    //
    // Parameter:
    //   localId - string, the local identifier of the element, without prefix.
    //             See getId() for details.
    //
    // Returns:
    //   * DOM Element, the element from the box with corresponding localId
    //   * null if no element is found in the box with the localId
    //
    // Note:
    //   A call to $() with no argument will return the box element, similarly
    //   to getBox(false).

    var element = dom.$( getId(localId) );
    if ( isInBox(element) ){
      return element;
    }
    log('Warning: element "'+getId(localId)+'" not part of box "'+id+'"');
    return null;
  }

  function element(name,attributes){
    // Function: dom.element(name[,attributes[,childNodes]]): DOM Element
    // Create a new DOM element using the configured DOM factory.
    // For example, using the default DOM factory,
    // |  element('a',{href:'#here',title:'Here'},'Click here')
    // will create a new DOM element
    // |  <a href='#here' title='Here'>Click here</a>
    //
    // A custom DOM factory can be configured using the property lbFactory
    // with <lb.core.application.setOptions(options)>.
    //
    // Parameters:
    //   name - string, the name of the element
    //   attributes - object, optional arguments as a set of named properties
    //   childNodes - array or list of arguments, the optional child nodes.
    //                Text nodes shall be represented simply as strings.
    //
    // Returns:
    //   DOM Element, the newly created DOM element.

    return factory.createElement.apply(factory,arguments);
  }

  function fireEvent(element, type, properties){
    // Function: dom.fireEvent(element,type[,properties]): DOM Event
    // Create and dispatch a new DOM event to the given element,
    // using the configured DOM factory.
    //
    // Parameters:
    //   element - DOM Element, an element of the box
    //   type - string, the name of an event (without 'on') e.g. 'click'
    //   properties - object, optional event properties. Each property will be
    //                copied to the new DOM event.
    //
    // Returns:
    //   DOM Event, the new DOM event

    // Warning: element parameter hides element() function
    return factory.createEvent(element, type, properties);
  }

  function cancelEvent(event){
    // Function: dom.cancelEvent(event)
    // Cancel an event using the configured DOM factory.
    //
    // Using the default DOM factory, cancelling an event prevents the default
    // action and stops bubbling.
    //
    // Parameter:
    //   event - DOM Event

    factory.destroyEvent(event);
  }

  function getListeners(){
    // Function: dom.getListeners(): array
    // Get the list of listeners configured on DOM elements of the box.
    // Listeners can be added with addListener() and removed one by one with
    // removeListener(), or all at once with removeAllListeners().
    //
    // Returns:
    //   array, the current list of listener objects (lb.base.dom.Listener)

    return listeners;
  }

  function addListener(element,type,callback){
    // Function: dom.addListener(element,type,callback): Listener
    // Register a new listener for a type of event on a DOM element of the box
    // using the configured DOM factory.
    //
    // Parameters:
    //   element - DOM Element, an element of the box
    //   type - string, the name of an event (without 'on') e.g. 'click'
    //   callback - function, a function to call when the event is dispatched.
    //
    // Returns:
    //   * null, when the element is outside the box (no listener added),
    //   * object, the new listener otherwise.
    //     This object shall be provided to removeListener() to unregister the
    //     listener. No other interaction is expected with this object.
    //
    // Notes:
    //   * the listener is set on bubbling phase.
    //   * the target element must be part of the box, i.e. already added to
    //     the DOM; otherwise the call is ignored per sandbox policy.

    // Warning: element parameter hides element() function
    if ( !isInBox(element) ){
      log('Warning: cannot add listener to element "'+element+
          '" outside of box "'+id+'"');
      return null;
    }

    var listener = factory.createListener(element,type,callback);
    listeners.push(listener);
    return listener;
  }

  function removeListener(listener){
    // Function: dom.removeListener(listener)
    // Unregister a listener, using the configured DOM factory.
    //
    // Parameters:
    //   listener - object, a listener instance returned by addListener().
    //
    // Note:
    //   Nothing happens when the listener has already been removed.

    // TODO: use lb.base.array.removeOne(listeners,listener) instead
    // To check that only removed listener is destroyed, a return value is
    // needed in removeOne(). It must be added in the base array module.
    for (var i=0; i<listeners.length; i++){
      if (listeners[i]===listener){
        factory.destroyListener(listener);
        listeners.splice(i,1);
        return;
      }
    }
  }

  function removeAllListeners(){
    // Function: dom.removeAllListeners()
    // Remove all listeners configured on DOM elements of the box, using the
    // configured DOM factory.
    //
    // All remaining listeners, previously configured with addListener(),
    // add removed. This method is intended as a cleanup utility ; it is called
    // automatically by the framework after the module terminates in end(),
    // which makes its use optional for the module itself.

    for (var i=0; i<listeners.length; i++){
      factory.destroyListener(listeners[i]);
    }
    removeAll(listeners);
  }

  function subscribe(filter,callback){
    // Function: events.subscribe(filter,callback)
    // Create a new event subscription, triggering the callback only for events
    // matching the provided filter.
    //
    // A new instance of Event Subscriber (lb.core.events.Subscriber) is
    // created and added to the Event publisher (lb.core.events.publisher).
    //
    // Parameters:
    //   filter - object, the event filter.
    //           This object is similar to event objects. Any included property
    //           will be used as a filter to restrict events part of the 
    //           subscription. For example:
    //           * {} is a subscription to all events (no filter)
    //           * {name: 'foo'} is a subscription to all events named 'foo'
    //           * {name: 'foo', id:42} filters on name==='foo' and id===42
    //   callback - function, the associated callback(event). The event object
    //              contains at least the same properties as the filter. In
    //              addition, custom properties may be defined by the creator
    //              of the event.

    var subscriber = new Subscriber(filter,callback);
    subscribers.push(subscriber);
    publisher.addSubscriber(subscriber);
  }

  function unsubscribe(filter){
    // Function: events.unsubscribe(filter)
    // Remove all subscriptions for given filter.
    //
    // Parameter:
    //   filter - object, an event filter.
    //
    // Note:
    //   It is not necessary to provide the identical filter project provided
    //   in subscribe(); all filters with the same set of properties/values
    //   will get the corresponding subscriptions removed.
    var i, subscriber;

    for (i=0; i<subscribers.length; i++){
      subscriber = subscribers[i];
      // check for equality as mutual inclusion
      if ( subscriber.includes( filter, subscriber.getFilter() ) &&
           subscriber.includes( subscriber.getFilter(), filter ) ) {
        publisher.removeSubscriber(subscriber);
        subscribers.splice(i,1);
        i--; // index for next item decreased
      }
    }
  }

  // Function: events.publish(event)
  // Publish a new event for broadcasting to all interested subscribers.
  //
  // Parameter:
  //   event - object, the event to publish. It shall be a valid JSON [1] 
  //           object: no methods, no circular references.
  //
  // Reference:
  // [1] Introducing JSON (JavaScript Object Notation)
  // http://www.json.org/

  // Note: publish is an alias for lb.core.events.publisher.publish

  // Function: i18n.getLanguageList(): array of strings
  // Get the list of available languages.
  //
  // Returns:
  //   array of strings, the list of language codes which have associated
  //   language properties, sorted from least specific to most specific.

  // Note: getLanguageList is an alias for lb.base.i18n.data.getLanguageCodes

  // Function: i18n.getSelectedLanguage(): string
  // Get the language currently selected for the application.
  //
  // Returns:
  //   string, the value of the 'lang' attribute of the root HTML element,
  //   or when it is missing or the empty string '', the value of the browser
  //   language found in navigator.language or navigator.browserLanguage.

  // Note: getSelectedLanguage() is an alias for getDefaultLanguageCode()
  //       in lb.base.i18n.data, which returns the same value

  // Function: i18n.selectLanguage(languageCode)
  // Select the language of the application, shared by all modules.
  //
  // The language code of selected language is stored in the 'lang' attribute
  // of the root HTML element. It is used as a default when the language code
  // is omitted in calls to i18n methods where language code is optional:
  // i18n.get(), i18n.getString(), i18n.filterHtml().
  //
  // Parameter:
  //   languageCode - string, the language code of the selected language
  //
  // Reference:
  //   RFC5646 - Tags for Identifying Languages
  //   http://tools.ietf.org/html/rfc5646
  function selectLanguage(languageCode){
    // I use and explicit call instead of aliasing to restrict the call to
    // the single argument version. If setting the language of a DOM element is
    // allowed, it should be checked that it is part of the box beforehand.
    i18n.setLanguage(languageCode);
  }

  // Function: i18n.addLanguageProperties(languageCode,languageProperties)
  // Define or replace properties for given language.
  //
  // Language properties are inherited by all languages whose language code
  // starts with the given language code:
  // * all languages inherit from the language '' (empty string)
  // * 'en-GB' and 'en-US' inherit from 'en'
  // * 'en-GB-Scotland' inherits from 'en-GB'
  //
  // Parameters:
  //   languageCode - string, the language code identifying the language,
  //                  as defined in RFC5646 "Tags for Identifying Languages"
  //   languageProperties - object, a JSON-like structure with language
  //                        properties, which may be several levels deep and
  //                        contain values of any type including functions.
  //
  // Reference:
  //   RFC5646 - Tags for Identifying Languages
  //   http://tools.ietf.org/html/rfc5646

  // Note: This is an alias for lb.base.i8n.data.addLanguageProperties

  // Function: i18n.get(key[,languageCode]): any
  // Get the value of the property identified by given key.
  //
  // Parameters:
  //   key - string or array, the key identifiying the property:
  //         * a property name: 'name' (at top level of language properties)
  //         * a dotted name: 'section.subsection.name' (nested property)
  //         * an array: ['section','subsection','name'] (alternate form for
  //                                                      nested properties)
  //   languageCode - string, optional, language code for lookup in a specific
  //                  language. Defaults to the language selected for the whole
  //                  application, as returned in getSelectedLanguage().
  //
  // Returns:
  //   * any, the value of the corresponding property in the most specific
  //     language available,
  //   * or null if not found

  // Note: get() is an alias for lb.base.i18n.data.get()

  // Function: i18n.getString(key[,data[,languageCode]]): string
  // Get a string computed by replacing data values in the most specific
  // value found for given key, used as a string template.
  //
  // When a function is found for the given key instead of a string template,
  // it is called with the key, data and language code, replaced with their
  // default values when omitted, and its return value is used as string
  // template instead.
  //
  // The parameters to replace are surrounded by '#' characters,
  // e.g. '#param-to-replace#'. No space can appear in the name;
  // only characters in the range [a-zA-Z0-9_\-\.] are allowed.
  //
  // Replacement values are provided as properties of the data object, with
  // the same name as the parameter:
  // | {
  // |   'param-to-replace': 'value'
  // | }
  //
  // Dotted parameter names, e.g. '#section.subsection.name#', are replaced
  // with values nested within sections and subsections of the data object:
  // | {
  // |   section: {
  // |     subsection: {
  // |       name: 'value'
  // |     }
  // |   }
  // | }
  //
  // In case a property is not found in the given data object, getString()
  // is called recursively to get the string value of the property for
  // parameter replacement.
  //
  // To summarize:
  //
  //   1. the key is looked up in language properties of selected language.
  //      A string is expected. If no value is found, null is returned.
  //      If a function is found, its return value is used instead
  //
  //   2. any parameter found in the string value is looked up, first in the
  //      given data, then in language properties of selected language, by
  //      calling getString() recursively. A string is expected for parameter
  //      replacement.
  //
  //   3. the resulting string, with parameters replaced, is returned.
  //
  // Parameters:
  //   key - string or array, the key identifiying the property:
  //         * a property name: 'name' (at top level of language properties)
  //         * a dotted name: 'section.subsection.name' (nested property)
  //         * an array: ['section','subsection','name'] (alternate form for
  //                                                      nested properties)
  //   data - object, optional, replacement values for parameters, which may
  //          be nested within sections and subsections. Defaults to an empty
  //          object, leaving all parameters unreplaced.
  //   languageCode - string, optional, language code for lookup in a specific
  //                  language. Defaults to the language selected for the whole
  //                  application, as returned by getSelectedLanguage().
  //
  // Returns:
  //   * string, the value of corresponding property, in the most specific
  //     language available, with parameters replaced with the value of
  //     corresponding properties found in data object or as a fallback in the
  //     language properties of the most specific language where available
  //   * or null if the property is not found

  // Note: getString() is an alias for lb.base.template.i18n.getString()

  // Function: i18n.filterHtml(htmlNode[,data[,languageCode]])
  // Replace parameters and trim nodes based on html 'lang' attribute.
  //
  // The given HTML node is modified in place. You should clone it beforehand
  // if you wish to preserve the original version.
  //
  // The HTML node is filtered according to the languageCode argument, or
  // if it is omitted, the language code of the application as returned by
  // getSelectedLanguage(). Multiple translations may be included
  // and only relevant translations will be kept, based on 'lang' attribute:
  // | <div lang=''>
  // |   <span lang='de'>Hallo #user.firstName#!</span>
  // |   <span lang='en'>Hi #user.firstName#!</span>
  // |   <span lang='fr'>Salut #user.firstName# !</span>
  // |   <span lang='jp'>こんにちは#user.lastName#!</span>
  // | </div>
  //
  // Filtering the HTML from the above example for the
  // language 'en-GB' would result in:
  // | <div lang=''>
  // |   <span lang='en'>Hi #user.firstName#!</span>
  // | </div>
  //
  // The 'lang' attribute is inherited from ancestors, including ancestors
  // of the given HTML node, unless it has a 'lang' attribute itself. The root
  // element of the HTML node will be removed from its parent as well if its
  // language does not match the language code used for filtering. Elements
  // within the scope of the empty language '' or in the scope of no language
  // attribute are preserved by the filtering. 
  //
  // Parameters of the form #param# found in text and attribute nodes are
  // replaced in the same way as using i18n.getString():
  // - the parameter format is based on following regular expression:
  //   /#([a-zA-Z0-9_\-\.]+)#/g
  // - data object contains values for the parameters to replace, which may
  //   be nested:
  //   | {
  //   |   user: {
  //   |     firstName: 'Jane',
  //   |     lastName: 'Doe'
  //   |   }
  //   | }
  // - when no property is found in data for the replacement of a parameter,
  //   a lookup is performed in language properties instead
  //
  // After parameter replacement, the HTML node of the above example would end
  // up as:
  // | <div lang=''>
  // |   <span lang='en'>Hi Jane!</span>
  // | </div>
  //
  // Parameters:
  //   htmlNode - DOM node, the node to apply the i18n filters to
  //   data - object, optional, replacement values for parameters found in
  //          attributes and text of the HTML node. Defaults to an empty object
  //   languageCode - string, optional, language code for lookup in a specific
  //                  language. Defaults to the language selected for the whole
  //                  application, as returned in getSelectedLanguage().
  //
  // Reference:
  //   Specifying the language of content: the lang attribute
  //   o http://www.w3.org/TR/html401/struct/dirlang.html#h-8.1

  // TODO: add implementation to check that htmlNode is part of the box

  // Note: filterHtml is an alias for lb.base.template.i18n.filterHtml

  // Function: server.send(url,data,receive)
  // Send and receive data from the remote host.
  //
  // Parameters:
  //   url - string, a url on remote host (must respect same origin policy)
  //   data - object, the data to send to the server. It must be valid JSON.
  //   receive - function, the callback with data received in response from
  //             the server. The data provided in argument will be a valid
  //             JSON object or array.

  // Note: send is an alias for lb.base.ajax.send

  function getLocation(){
    // Function: url.getLocation(): object
    // Get the properties of the current URL location
    //
    // Returns:
    //   an object with a copy of properties commonly found on window.location
    //   and document.location:
    //     * href - string, the absolute URL of the current document
    //     * protocol - string, the protocol part of the URL, e.g. 'http://'
    //     * host - string, the host and port part of the url, e.g.
    //              'example.com:8080' or often just 'example.com'
    //     * hostname - the host name part of the URL, e.g. 'example:com'
    //     * port - string, the port part of the URL, e.g. '8080' or often ''
    //     * pathname - string, the relative path, e.g. '/2010/10/31/index.php'
    //     * search - string, the query part of the url, e.g. '?param=value'
    //     * hash - string, the local part of the url, e.g. '#anchor'.
    //   These properties are read-only here and not shared with other modules.
    var location = window.location;
    return {
      href: location.href,
      protocol: location.protocol,
      host: location.host,
      hostname: location.hostname,
      port: location.port,
      pathname: location.pathname,
      search: location.search,
      hash: location.hash
    };
  }

  // Function: url.setHash(hash)
  // Jump to a new local location by replacing the hash part of the URL.
  //
  // This method is used for local navigation, and ensures, in collaboration
  // with the cross-browser history adapter module, that the back button
  // of the browser works as expected.
  //
  // Parameter:
  //   hash - string, the new local location, e.g. '#local/path'

  // Note: setHash is an alias for lb.base.history.setHash

  function onHashChange(callback){
    // Function: url.onHashChange(callback)
    // Set a listener to observe changes in local part of the URL.
    // Calling this method with a new callback will replace the listener
    // previously set. Calling onHashChange(null) will remove the current
    // listener altogether.
    //
    // Parameter:
    //   callback - function, the callback(hash) function will be called once
    //              for each subsequent change of hash. The hash parameter is a
    //              string, decoded, starting with the '#' character.

    if ( has(hashChangeCallback) ){
      history.removeListener(hashChangeCallback);
    }
    hashChangeCallback = callback;
    if ( has(callback) ){
      history.addListener(callback);
    }
  }

  // Function: utils.has(object,property[,...]): boolean
  // Check whether an object property is present and not null nor undefined.
  //
  // A chain of nested properties may be checked by providing more than two
  // arguments.
  //
  // The intent of this method is to replace unsafe tests relying on type
  // coercion for optional arguments or object properties:
  // | function on(event,options){
  // |   options = options || {}; // type coercion
  // |   if (!event || !event.data || !event.data.value){
  // |     // unsafe due to type coercion: all falsy values '', false, 0
  // |     // are discarded, not just null and undefined
  // |     return;
  // |   }
  // |   // ...
  // | }
  // with a safer test without type coercion:
  // | function on(event,options){
  // |   options = has(options)? options : {}; // no type coercion
  // |   if (!has(event,'data','value'){
  // |     // safe check: only null/undefined values are rejected;
  // |     return;
  // |   }
  // |   // ...
  // | }
  //
  // Parameters:
  //   object - any, an object or any other value
  //   property - string, the name of the property to look up
  //   ...      - string, additional property names to check in turn
  //
  // Returns:
  //   * false if no argument is provided or if the object is null or
  //     undefined, whatever the number of arguments
  //   * true if the full chain of nested properties is found in the object
  //     and the corresponding value is neither null nor undefined
  //   * false otherwise

  // Note: is is an alias for lb.base.object.has

  // Function: utils.is([...,]value[,type]): boolean
  // Check the type of a value, possibly nested in sub-properties.
  //
  // The method may be called with a single argument to check that the value
  // is neither null nor undefined.
  //
  // If more than two arguments are provided, the value is considered to be
  // nested within a chain of properties starting with the first argument:
  // | is(object,'parent','child','leaf','boolean')
  // will check whether the property object.parent.child.leaf exists and is
  // a boolean.
  //
  // The intent of this method is to replace unsafe guard conditions that
  // rely on type coercion:
  // | if (object && object.parent && object.parent.child) {
  // |   // Issue: all falsy values are treated like null and undefined:
  // |   // '', 0, false...
  // | }
  // with a safer check in a single call:
  // | if ( is(object,'parent','child','number') ) {
  // |   // only null and undefined values are rejected
  // |   // and the type expected (here 'number') is explicit
  // | }
  //
  // Parameters:
  //   ...   - any, optional, a chain of parent properties for a nested value
  //   value - any, the value to check, which may be nested in a chain made
  //           of previous arguments (see above)
  //   type - string, optional, the type expected for the value.
  //          Alternatively, a constructor function may be provided to check
  //          whether the value is an instance of given constructor.
  //
  // Returns:
  //   * false, if no argument is provided
  //   * false, if a single argument is provided which is null or undefined
  //   * true, if a single argument is provided, which is not null/undefined
  //   * if the type argument is a non-empty string, it is compared with the
  //     internal class of the value, put in lower case
  //   * if the type argument is a function, the instanceof operator is used
  //     to check if the value is considered an instance of the function
  //   * otherwise, the value is compared with the provided type using the
  //     strict equality operator ===
  //
  // Type Reference:
  //   'undefined' - undefined
  //   'null'      - null
  //   'boolean'   - false, true
  //   'number'    - -1, 0, 1, 2, 3, Math.sqrt(2), Math.E, Math.PI...
  //   'string'    - '', 'abc', "Text!?"...
  //   'array'     - [], [1,2,3], ['a',{},3]...
  //   'object'    - {}, {question:'?',answer:42}, {a:{b:{c:3}}}...
  //   'regexp'    - /abc/g, /[0-9a-z]+/i...
  //   'function'  - function(){}, Date, setTimeout...
  //
  // Notes:
  // This method retrieves the internal class of the provided value using
  // | Object.prototype.toString.call(value).slice(8, -1)
  // The class is then converted to lower case.
  //
  // See "The Class of an Object" section in the JavaScript Garden for
  // more details on the internal class:
  // http://bonsaiden.github.com/JavaScript-Garden/#types.typeof
  //
  // The internal class is only guaranteed to be the same in all browsers for
  // Core JavaScript classes defined in ECMAScript. It differs for classes
  // part of the Browser Object Model (BOM) and Document Object Model (DOM):
  // window, document, DOM nodes:
  //
  //   window        - 'Object' (IE), 'Window' (Firefox,Opera),
  //                   'global' (Chrome), 'DOMWindow' (Safari)
  //   document      - 'Object' (IE),
  //                   'HTMLDocument' (Firefox,Chrome,Safari,Opera)
  //   document.body - 'Object' (IE),
  //                   'HTMLBodyElement' (Firefox,Chrome,Safari,Opera)
  //   document.createElement('div') - 'Object' (IE)
  //                   'HTMLDivElement' (Firefox,Chrome,Safari,Opera)
  //   document.createComment('') - 'Object' (IE),
  //                   'Comment' (Firefox,Chrome,Safari,Opera)

  // Note: is is an alias for lb.base.type.is

  function getTimestamp(){
    // Function: utils.getTimestamp(): number
    // Get current timestamp, in milliseconds.
    //
    // Returns:
    //   number, the number of milliseconds ellapsed since the epoch
    //   (January 1st, 1970 at 00:00:00.000 UTC).

    return (new Date()).getTime();
  }

  function setTimeout(callback, delay){
    // Function: utils.setTimeout(callback,delay): number
    // Plan the delayed execution of a callback function.
    //
    // Parameters:
    //   callback - function, the function to run after a delay
    //   delay - integer, the delay in milliseconds
    //
    // Returns:
    //   number, the timeout identifier to be passed to utils.clearTimeout()
    //   to cancel the planned execution.

    return window.setTimeout(function(){
      try {
        callback();
      } catch(e){
        log('ERROR: failure in setTimeout for callback '+callback+'.');
      }
    },delay);
  }

  function clearTimeout(timeoutId){
    // Function: utils.clearTimeout(timeoutId)
    // Cancels the planned execution of a callback function.
    //
    // Parameter:
    //   timeoutId - number, the identifier returned by the call to
    //               utils.clearTimeou() to cancel.

    window.clearTimeout(timeoutId);
  }

  // Function: utils.trim(string): string
  // Remove leading and trailing whitespace from a string.
  //
  // Parameter:
  //   string - string, the string to trim
  //
  // Returns:
  //   string, a copy of the string with no whitespace at start and end

  // Note: trim is an alias for lb.base.string.trim

  // Function: utils.log(message)
  // Log a message.
  //
  // Log messages will be printed in the browser console, when available,
  // and if the log output has been activated, which happens when Debug=true
  // is included anywhere in the URL.
  //
  // Parameter:
  //   message - string, the message to log

  // Note: log is an alias for lb.base.log.print

  function confirm(message){
    // Function: utils.confirm(message): boolean
    // Open a confirmation (OK/Cancel) dialog.
    //
    // Parameter:
    //   message - string, the confirmation message
    //
    // Returns:
    //   boolean, true if user clicked OK, false is she clicked Cancel button.

    return window.confirm(message);
  }

  // Public methods
  this.getId = getId;
  this.getBox = getBox;
  this.isInBox = isInBox;
  this.dom = {
    $:$,
    element: element,
    fireEvent: fireEvent,
    cancelEvent: cancelEvent,
    getListeners: getListeners,
    addListener: addListener,
    removeListener: removeListener,
    removeAllListeners: removeAllListeners
  };
  this.events = {
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    publish: publisher.publish
  };
  this.i18n = {
    getLanguageList: i18nData.getLanguageCodes,
    getSelectedLanguage: i18nData.getDefaultLanguageCode,
    selectLanguage: selectLanguage,
    addLanguageProperties: i18nData.addLanguageProperties,
    get: i18nData.get,
    getString: i18nTemplate.getString,
    filterHtml: i18nTemplate.filterHtml
  };
  this.server = {
    send: send
  };
  this.url = {
    getLocation: getLocation,
    setHash: setHash,
    onHashChange: onHashChange
  };
  this.utils = {
    has: has,
    is: is,
    getTimestamp: getTimestamp,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    trim: trim,
    log: log,
    confirm: confirm
  };
};
