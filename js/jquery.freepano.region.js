(function($){

function Region(options) {
  if (!(this instanceof Region)) {
    return new Region(options);
  }
  $.extend(true,this,this.defaults,options);
  this.init();
}

$.extend(true,Region.prototype,{

  defaults: {
    css: {
      borderColor: 'red'
    }
  },

  init: function region_init() {
    var region=this;
    var panorama=region.panorama;

    $(panorama.container).selrect({
      region: region,
      css: region.css,
      callback: function region_callback(e) {
        var selrect=this;
        if (typeof(e)=="string") {
          e={type: e};
        }
        if (region['on_selrect_'+e.type]) {
          return region['on_selrect_'+e.type].apply(selrect,[e]);
        }
      }
    });

  }, // region_init

  on_selrect_init: function region_on_selrect_init(e) {
    var selrect=this;
    if (!this.ok) {
      Panorama.prototype.dispatchEventsTo(selrect,{prepend: true});
      this.ok=true;
    }
  },

  on_selrect_mousemove: function region_onmousemove(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },

  on_selrect_mouseup: function region_on_selrect_mouseup(e) {
    var region=this.region;
    e.preventDefault();
    e.stopPropagation();

    region.dispatch({
      type: 'selrect',
      target: this
    });
    Panorama.prototype.dispatchEventsTo(this,{dispose: true});
    $(this.div).remove();
    return false;
  },

  dispose: function region_dispose() {
  } // region_dispose

});

Panorama.prototype.Region=Region;

})(jQuery);

setupEventDispatcher(Panorama.prototype.Region.prototype);

