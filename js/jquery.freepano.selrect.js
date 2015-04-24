
function SelRect(options) {
  if (!(this instanceof SelRect)) {
    return new SelRect(options);
  }
  $.extend(true,this,this.defaults,options);
  this.init();
}

$.extend(true,SelRect.prototype,{

  defaults: {
    css: {
      borderColor: 'red'
    }
  },

  init: function selRect_init() {
    var selRect=this;
    var panorama=selRect.panorama;

    $(panorama.container).selrect({
      selRect: selRect,
      css: selRect.css,
      callback: function selRect_callback(e) {
        var selrect=this;
        if (typeof(e)=="string") {
          e={type: e};
        }
        if (selRect['on_selrect_'+e.type]) {
          return selRect['on_selrect_'+e.type].apply(selrect,[e]);
        }
      }
    });

  }, // selRect_init

  on_selrect_init: function selRect_on_selrect_init(e) {
    var selrect=this;
    if (!this.ok) {
      Panorama.prototype.dispatchEventsTo(selrect,{prepend: true});
      this.ok=true;
    }
  },

  on_selrect_mousemove: function selRect_onmousemove(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },

  on_selrect_mouseup: function selRect_on_selrect_mouseup(e) {
    var selRect=this.selRect;
    e.preventDefault();
    e.stopPropagation();

    selRect.dispatch({
      type: 'selrect',
      target: this
    });
    Panorama.prototype.dispatchEventsTo(this,{dispose: true});
    $(this.div).remove();
    return false;
  },

  dispose: function selRect_dispose() {
  } // selRect_dispose

});

setupEventDispatcher(SelRect.prototype);
