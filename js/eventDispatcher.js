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
 *  you want to trigger events, eg:
 *
 *        setupEventDispatcher(Panorama.prototype);
 *
 *  Events can now be triggered with the dispatch() method, eg:
 *
 *       p=new Panorama({...}); p.dispatch('myevent',...);
 *
 *
 *  2. Request dispatching events to another object prototype, eg:
 *
 *        Panorama.prototype.dispatchEventsTo(MyModule.prototype);
 *
 *  Now when an event is triggered with dispatch,
 *  for each subscriber (in order of addition),
 *  the "on_panorama_<event>" method will be called, if any.
 *  And finally the method Panorama.on<event>() for the "source" prototype
 *
 *  If any handler return value is strictly equal to false, then
 *  event propagation will be stopped.
 *
 *  3. Define handlers for required events in in MyModule.prototype,
 *     eg "preinit", "ready", "update", "render" or "dispose",
 *     (in the case of Panorama events)
 *
 *        MyModule.prototype.on_panorama_preinit: function myModule_on_panorama_preinit() {}
 *
 */

var eventDispatcherDebug=false;
window.eventDispatcherSerial=0;

// setup specified prototype or instance to dispatch events among subscribers
function setupEventDispatcher(obj) {

  obj.subscribers=[];

  // allow other prototypes or instances to subscribe to obj events
  obj.dispatchEventsTo=function eventDispatcher_dispatchEventsTo(obj){
    var instance=this;
    if (instance.subscribers.indexOf(obj)<0) {
      instance.subscribers.push(obj);
    }
  } // eventDispatcher_dispatchEventsTo

  // dispatch event among subscribers and self
  obj.dispatch=function eventDispatcher_dispatch(e){
    var obj=this;

    // convert event to object, if needed
    if (typeof(e)=='string') {
      e={
        type: e,
        target: this
      }
    }

    if (eventDispatcherDebug) {
      var serial=window.eventDispatcherSerial++;
      console.log(serial+' dispatching '+obj.constructor.name+' "'+e.type+'"');
    }

    // forward also additional arguments, if any
    var args=Array.prototype.slice(arguments);

    // run suscribers handler for this event type, if any
    var method='on_'+obj.constructor.name.toLowerCase()+'_'+e.type;
    var stopPropagation=false;
    $.each(obj.subscribers,function(i,subscriber){
      if (subscriber[method] && typeof(subscriber[method]=="function")) {
        if (eventDispatcherDebug) {
          console.log(serial+' '+method+' -> '+subscriber.constructor.name);
        }
        if (subscriber[method].apply(obj,[e].concat(args||[]))===false) {
          // stop propagation if any subscriber handler return false
          stopPropagation=true;
          if (eventDispatcherDebug) {
            console.log(serial+' '+method+' -> '+'propagation stopped by: '+subscriber.constructor.name);
          }
          return false;
        }
      } else {
        if (eventDispatcherDebug>1){
          console.log(serial+' '+method+' -> '+'warning: '+subscriber.constructor.name+'.'+method+' is undefined');
        }
      }
    });

    if (stopPropagation) {
      return false;
    }

    // run self handler if any
    method='on'+e.type;
    if (obj[method] && typeof(obj[method]=="function")) {
      if (eventDispatcherDebug) {
        console.log(serial+' '+method+' -> '+obj.constructor.name);
      }
      if (obj[method].apply(obj,[e].concat(args||[]))===false) {
        if (eventDispatcherDebug) {
          console.log(serial+' '+method+' -> '+'propagation stopped by: '+obj.constructor.name);
        }
        return false;
      }
    } else {
      if (eventDispatcherDebug>1){
        console.log(serial+' '+method+' -> '+'warning: '+obj.constructor.name+'.'+method+' is undefined');
      }
    }

  } // eventDispatcher_trigger

} // setupEventDispatcher

