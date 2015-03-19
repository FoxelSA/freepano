
# Javascript coding and naming conventions used in this project

## Objects

Everything declared in the object constructor is not overridable,
so dont declare anything in the constructor.

In the constructor, just extend the new instance with MyObject.prototype.defaults
and passed arguments (options), as shown below (please copy this snippet 'as is').


    function MyObject(options) {

      var myObject=this;

      // Allow to omit the "new" operator
      if (!(myObject instanceof MyObject)) {
        return new MyObject(options);
      }

      $.extend(

          // recursively
          true,

          // this instance
          myObject,

          // with MyObject prototype defaults
          myObject.defaults,

          // and the constructor optionals arguments
          /* (which could override MyObject.defaults above, or other
              MyObject.prototype properties and methods defined in
              $.extend below)
          */
          options
      );

      myObject.init();
    }


Use the constructor above without adding or removing anything.
To extend the constructor, use the following model, where every declaration
is overridable at the prototype or instance level.

    $.extend(true,MyObject.prototype,{

      // properties that you may want to modify at init time
      defaults: {
          myproperty: 0

      }, // myObject_defaults

      // constants or "private" properties
      myconstant: 43,

      // the overridable part of the constructor
      init: function myObject_init() {
        myObject=this;

      }, // myObject_init

      myMethod: function myObject_myMethod() {
      }, // myObject_myMethod

    });

## Methods

Methods must never be anonymous for the following reasons:
 1. To locate them efficiently with a global search (eg: myObject_onclick)
 2. So that the debugger can display full names instead of "Function"
 3. To be able of calling them recursively by their names.
 4. So that they dont 'disappear' when referenced in another object and
    the object they are coming from is deleted.

Name your methods as shown below, prepending the method name with the
object name (first letter in lowercase):

    myMethod: function myObject_myMethod() { 

      // always assign the global variable 'this' to a local variable
      // whose name is the object constructor name (first letter
      // in lowercase), for lisibility and use in closures
      
      var myObject=this; 


Repeat the function name after the closing accolade, so that you dont need
to scroll up to know when you see only the bottom.

    }, // myObject_myMethod


## Event handling

Read details in eventDispatcher.js header.

### Event handlers

Event handlers methods begin with 'on'.

Eg myObject 'click' event handler:

    onclick: function myObject_onclick(e) {

      console.log('"myobject_click" event was not canceled');

    }, // myObject_onclick


Event handlers for external events begin with 'on', followed by the emitter
constructor name and the event type, all in lowercase and separated with '_'

Eg myOtherObject 'myobject_click' handler:

    on_myobject_click: function myOtherObject_on_myobject_click(e) {

      var myobject=this;

      if (Math.random()>0.5) {
        console.log('myOtherObject.prototype.on_myobject_click canceled "myobject_click" event');

        // return strict false to stop event propagation
        return false;
      }

    }, // myOtherObject_on_myobject_click


See eventDispatcher.js for details

