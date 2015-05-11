/*
 * freepano - WebGL panorama viewer
 *
 * Copyright (c) 2015 FOXEL SA - http://foxel.ch
 * Please read <http://foxel.ch/license> for more information.
 *
 *
 * Author(s):
 *
 *      Luc Deschenaux <l.deschenaux@foxel.ch>
 *
 *
 * This file is part of the FOXEL project <http://foxel.ch>.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Additional Terms:
 *
 *      You are required to preserve legal notices and author attributions in
 *      that material or in the Appropriate Legal Notices displayed by works
 *      containing it.
 *
 *      You are required to attribute the work as explained in the "Usage and
 *      Attribution" section of <http://foxel.ch/license>.
 */

/*
 *  Usage example: 
 *
 *  1. Setup the event dispatcher for the object prototype from which
 *  you want to trigger events (the emitter), eg:
 *
 *        setupEventDispatcher(myobject.prototype);
 *
 *  Events can now be triggered with the dispatch() method, eg:
 *
 *       myobject=new MyObject({...});
 *       myobject.dispatch('myevent', ...);
 *
 *  Now when an event is triggered with "myobject.dispatch('myevent')",
 *  the method MyObject.prototype.onmyevent() will be called, if existing.
 *
 *  The value of 'this' will be equal to the emitter object prototype or
 *  instance.
 *
 *  Additional arguments added to the dispatch() call, will be passed to the
 *  event handler after the event object.
 *
 *  2. You can now request dispatching events to another object prototype, eg:
 *
 *        MyObject.prototype.dispatchEventsTo(OtherObject.prototype);
 *
 *  Now when an event is triggered with:
 *       myobject.dispatch('myevent', ...);
 *
 * or with
 *        myobject.dispatch({type: 'myevent', ...}, ...);
 *        
 *  the "otherobject.on_myobject_myevent(event, ...)" method will be called,
 *  if existing. (for otherobject and for each other receiver in order of
 *  addition.
 *  
 *  And finally the method eg MyObject.prototype.onmyevent(), if any.
 *
 *  If any handler return value is strictly equal to false, then
 *  event propagation will be stopped. You can use this mechanism eg
 *  to cancel a 'close' or 'delete' event.:
 *
 *       MyObject.prototype.close=function(){ this.dispatch('close'); }
 *       MyObject.prototype.onclose=function() {
 *          console.log('close event has not been canceled');
 *       }
 *
 *  As resulting rule, every method name begining with 'on' must be considered
 *  an event handler, and if the term 'on' is followed by an underscore, then
 *  the second term is the object constructor name (in lowercase) from which the
 *  event is dispatched, and the third term is the event type.
 *
 *  The value of the global variable 'this' will be equal to the emmiter
 *  object prototype or instance.
 *
 *  Additional arguments added to the dispatch() call, will be passed to the
 *  event handler after the event object.
 *
 */

var eventDispatcherDebug=false;

// unique serial for events
window.eventDispatcherSerial=0;

/**
 * setupEventDispatcher(obj)
 *
 * Setup specified prototype or instance (obj) to dispatch 'obj' events among
 * receivers
 * 
 * @param obj   the emitter prototype or instance that will dispatch events
 *
 * @return undefined
 *
 */
function setupEventDispatcher(emitter) {

  emitter.receivers=[];

  /**
   * emitter.dispatchEventsTo(receiver_obj)
   *
   * Add 'receiver_obj' to the list of instances/prototypes for which we
   * must dispatch events triggered by/for 'emitter' 
   *
   * @param receiver_obj  the object instance or prototype for which we must
   *                      dispatch 'emitter' events
   *
   * @return undefined
   *
   */
  emitter.dispatchEventsTo=function eventDispatcher_dispatchEventsTo(receiver_obj,options){
    var emitter=this;
    // dont add receiver_obj twice
    var index=emitter.receivers.indexOf(receiver_obj);
    if (index<0) {
      if (options && options.prepend) {
        emitter.receivers.unshift(receiver_obj);
      } else {
        emitter.receivers.push(receiver_obj);
      }
    } else {
        if (options && options.dispose) {
           emitter.receivers.splice(index,1);
        }
    }
  } // eventDispatcher_dispatchEventsTo

  /** 
   * emitter.dispatch(event, ...)
   *
   * Dispatch event among receivers and self
   *
   * If any receiver returns false, abort propagation.
   * If any extra arguments are specified, forward them.
   * Run self (emitter) event handler last.
   *
   * @param event  the event object or string (that will be converted to)
   * @param ...    optional parameters
   *
   * @return Boolean
   *
   */
  emitter.dispatch=function eventDispatcher_dispatch(e){
    var emitter=this;

    // convert event to object, if needed
    if (typeof(e)=='string') {
      e={
        type: e,
        target: this
      }
    }

    // THREE.js constructors are unnamed
    var emitter_constructor_name=emitter.object_type||emitter.constructor.name||emitter.type;

    if (eventDispatcherDebug) {
      var serial=window.eventDispatcherSerial++;
      console.log(serial+' dispatching '+emitter_constructor_name+' "'+e.type+'"');
    }

    // forward also additional arguments, if any
    var args=Array.prototype.slice.apply(arguments,[1]);

    // run suscribers handler for this event type, if any
    var method='on_'+emitter_constructor_name.toLowerCase()+'_'+e.type;
    var stopPropagation=false;

    $.each(emitter.receivers,function(i,receiver){

      // THREE.js constructors are unnamed
      var receiver_constructor_name=(receiver.constructor.name||receiver.type);

      // if suscriber event handler exists for this event type
      if (receiver[method] && typeof(receiver[method]=="function")) {

        if (eventDispatcherDebug) {
          console.log(serial+' '+method+' -> '+receiver_constructor_name);
        }

        // run receiver event handler
        if (receiver[method].apply(emitter,[e].concat(args||[]))===false) {

          // stop propagation if any receiver handler return false
          stopPropagation=true;

          if (eventDispatcherDebug) {
            console.log(serial+' '+method+' -> '+'propagation stopped by: '+receiver_constructor_name);
          }

          return false;
        }

      } else {
        // receiver event handler doesnt exist for this event type
        if (eventDispatcherDebug>1){
          console.log(serial+' '+method+' -> '+'warning: '+receiver_constructor_name+'.'+method+' is undefined');
        }
      }
    });

    // stop event propagation
    if (stopPropagation) {
      return false;
    }

    // run self handler if any
    method='on'+e.type;
    if (emitter[method] && typeof(emitter[method]=="function")) {

      if (eventDispatcherDebug) {
        console.log(serial+' '+method+' -> '+emitter_constructor_name);
      }

      // run self handler
      if (emitter[method].apply(emitter,[e].concat(args||[]))===false) {

        // stop propagation if any receiver handler return false
        //
        if (eventDispatcherDebug) {
          console.log(serial+' '+method+' -> '+'propagation stopped by: '+emitter_constructor_name);
        }

        return false;
      }

    } else {
      if (eventDispatcherDebug>1){
        console.log(serial+' '+method+' -> '+'warning: '+emitter_constructor_name+'.'+method+' is undefined');
      }
    }

  } // eventDispatcher_dispatch

} // setupEventDispatcher

