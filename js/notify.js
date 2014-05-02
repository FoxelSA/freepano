       
var toasts={};
function notify(message,options){
       
  console.log(message);
  console.trace();
       
  $("#status").hide();
  if (typeof(loading_intvl)!='undefined' && loading_intvl) clearInterval(loading_intvl);
       
  var _options={
     type: 'error',
     sticky: true,
     position: 'top-left'
  }    
  if (typeof(options)=="object") {
    $.extend(_options,options);
  }    
  if (typeof(message)=="string") {
    _options.text=message;
  }    
  if (typeof(message)=="object") {
    $.extend(_options,options);
  }    
  var msgid=btoa(_options.text);
       
  if (toasts[msgid]) return;
       
  toasts[msgid]={
    close: function(){}
  };   
       
  if (_options.close) {
    toasts[msgid].close=_options.close;
  }    
  _options.close=function(){
    toasts[msgid].close();
    delete(toasts[msgid]);
  }    
       
  return toasts[msgid].toast=$().toastmessage('showToast',_options);
       
}
                                                                                                                                                                                                                                                                                
$.notify=notify;
       

