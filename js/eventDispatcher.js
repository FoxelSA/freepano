
var eventDispatcherDebug=1;

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

    console.log('dispatching '+obj.constructor.name+' "'+e.type+'"');

    // forward also additional arguments, if any
    var args=Array.prototype.slice(arguments);

    // run suscribers handler for this event type, if any
    var method='on_'+obj.constructor.name.toLowerCase()+'_'+e.type;
    var stopPropagation=false;
    $.each(obj.subscribers,function(i,subscriber){
      if (subscriber[method] && typeof(subscriber[method]=="function")) {
        if (eventDispatcherDebug) {
          console.log(subscriber.constructor.name+'.'+method);
        }
        if (subscriber[method].apply(obj,[e].concat(args||[]))===false) {
          // stop propagation if any subscriber handler return false
          stopPropagation=true;
          if (eventDispatcherDebug) {
            console.log('propagation stopped by: '+subscriber.constructor.name+'.'+method);
          }
          return false;
        }
      } else {
        if (eventDispatcherDebug>1){
          console.log('warning: '+subscriber.constructor.name+'.'+method+' is undefined');
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
        console.log(obj.constructor.name+'.'+method);
      }
      if (obj[method].apply(obj,[e].concat(args||[]))===false) {
        if (eventDispatcherDebug) {
          console.log('propagation stopped by: '+obj.constructor.name+'.'+method);
        }
        return false;
      }
    } else {
      if (eventDispatcherDebug>1){
        console.log('warning: '+obj.constructor.name+'.'+method+' is undefined');
      }
    }

  } // eventDispatcher_trigger

} // setupEventDispatcher

