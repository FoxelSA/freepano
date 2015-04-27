(function($,Panorama){

/**
 * Region()
 *
 * Region constructor
 *
 * Instantiate rectangular selection rectangle on panorama_mousedown,
 * dispatch a region_ready event on panorama_mouseup
 *
 */
function Region(options) {
  if (!(this instanceof Region)) {
    return new Region(options);
  }
  $.extend(true,this,this.defaults,options);
  this.init();

} // Region

$.extend(true,Region.prototype,{

  // default region options
  defaults: {
    selrect: {
      css: {
        // selection rectangle color
        borderColor: 'red'
      }
    }
  }, // region_defaults

  /**
   * Region.init()
   *
   * Initialize region instance
   *
   */
  init: function region_init() {

    var region=this;
    var panorama=region.panorama;

    // instantiate the selection rectangle
    $(panorama.container).selrect({

      region: region,

      css: region.selrect.css,

      // selrect event handler
      callback: function selrect_callback(e) {

        var selrect=this;

        if (typeof(e)=="string") {
          e={type: e};
        }

        // forward selrect events to region instance
        if (region['on_selrect_'+e.type]) {
          return region['on_selrect_'+e.type].apply(selrect,[e]);
        }

      } // selrect_callback

    }); // selrect

  }, // region_init


  /**
   * Region.on_selrect_init()
   *
   * selrect_init event handler
   *
   */
  on_selrect_init: function region_on_selrect_init(e) {

    var selrect=this;

    // forward future panorama (mouse) events to this selrect instance
    Panorama.prototype.dispatchEventsTo(selrect,{

      // intercept mouse events before Controls.prototype handlers
      prepend: true

    });

  }, // region_on_selrect_init

  /**
   * Region.on_selrect_mousemove()
   *
   * selrect_mousemove event handler
   *
   */
  on_selrect_mousemove: function region_on_selrect_mousemove(e) {
    // prevent panorama_mousemove event from reaching Controls or Panorama handlers
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, // region_on_select_mousemove

  /**
   * Region.on_selrect_mouseup()
   *
   * selrect_mouseup event handler
   *
   */
  on_selrect_mouseup: function region_on_selrect_mouseup(e) {

    var selrect=this;
    var region=selrect.region;

    // prevent panorama_mouseup event from reaching Controls or Panorama handlers
    e.preventDefault();
    e.stopPropagation();

    // region has been selected
    region.rect=selrect.rect;
    region.dispatch({
      type: 'ready',
      rect: selrect.rect
    });

    // selrect instance does not need to receive Panorama events anymore
    Panorama.prototype.dispatchEventsTo(selrect,{dispose: true});

    // selrect div is not needed anymore
    $(selrect.div).remove();

    return false;

  }, // region_on_selrect_mouseup

});

// add Region to Panorama.prototype
Panorama.prototype.Region=Region;

})(jQuery,Panorama);

// Region need to receive Panorama mouse events
        
setupEventDispatcher(Panorama.prototype.Region.prototype);

