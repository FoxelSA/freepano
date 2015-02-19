
var eventHandlerDebug=false;

// setup specified prototype or instance to dispatch events among subscribers
function setupEventHandler(obj) {

  obj.subscribers=[];

  // allow other prototypes or instances to subscribe to obj events
  obj.subscribe=function eventHandler_subscribe(obj){
    var instance=this;
    if (instance.subscribers.indexOf(obj)<0) {
      instance.subscribers.push(obj);
    }
  } // eventHandler_subscribe

  // dispatch event among subscribers and self
  obj.trigger=function eventHandler_trigger(e){
    var obj=this;

    // convert event to object, if needed
    if (typeof(e)=='string') {
      e={
        type: e,
        target: this
      }
    }

    // forward also additional arguments, if any
    var args=array.prototype.slice(arguments);

    // run suscribers handler for this event type, if any
    var method='on_'+obj.constructor.name.toLowerCase()+'_'+e.type;
    var stopPropagation=false;
    $.each(obj.subscribers,function(subscriber){
      if (subscriber[method] && typeof(subscriber[method]=="function")) {
        if (eventHandlerDebug) {
          console.log('dispatch event: '+subscriber.constructor.name+'.'+method);
        }
        if (subscriber[method].apply(obj,args))===false) {
          // stop propagation if any subscriber handler return false
          stopPropagation=true;
          if (eventHandlerDebug) {
            console.log('propagation stopped by: '+subscriber.constructor.name+'.'+method);
          }
          return false;
        }
      }
    });

    if (stopPropagation) {
      return false;
    }

    // run self handler if any
    method='on'+e.type;
    if (obj[method] && typeof(obj[method]=="function")) {
      if (eventHandlerDebug) {
        console.log('dispatch event: '+obj.constructor.name+'.'+method);
      }
      if (obj[method].apply(obj,args)===false) {
        if (eventHandlerDebug) {
          console.log('propagation stopped by: '+subscriber.constructor.name+'.'+method);
        }
        return false;
      }
    }

  } // eventHandler_trigger

} // setupEventHandler

