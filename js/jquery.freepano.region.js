/*
 * freepano - WebGL panorama viewer
 *
 * Copyright (c) 2014-2015 FOXEL SA - http://foxel.ch
 * Please read <http://foxel.ch/license> for more information.
 *
 *
 * Author(s):
 *
 *      Luc Deschenaux <l.deschenaux@foxel.ch>
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

(function($,Panorama){

/**
 * Region()
 *
 * Region object constructor
 *
 * Instantiate selection rectangle on panorama_mousedown,
 * dispatch a region_ready event on panorama_mouseup
 *
 * @param options.persistent  dont dispose selrect.div on mouseup
 * @param options.resizable  allow resizing (implies options.persistent) 
 * @param options.selrect.css   the selrect.div css properties
 * @return region   Region object instance
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
      className: 'selrect',
      css: {
        // selection rectangle color
        borderColor: 'red'
      },
      persistent: false,
      resizable: false
    }
  }, // region_defaults

  // region mode
  mode: {
    resizable: false
  },

  /**
   * Region.init()
   *
   * Initialize Region instance
   *
   */
  init: function region_init() {

    var region=this;
    var panorama=region.panorama;

    region.persistent=region.persistent||region.resizable;

    // instantiate the selection rectangle
    var jq=$(panorama.container).selrect({

      region: region,

      resizable: true,

      css: region.selrect.css,

      // selrect event handler
      callback: function selrect_callback(e) {

        var selrect=this;

        if (typeof(e)=="string") {
          e={type: e};
        }

        // forward selrect events to region instance
        if (selrect.region['on_selrect_'+e.type]) {
          return selrect.region['on_selrect_'+e.type].apply(selrect,[e]);
        }

      }, // selrect_callback

      on_panorama_mousedown: function selrect_on_panorama_mousedown(e) {
        return this.selrect.onmousedown(e);
      },

      on_panorama_mousemove: function selrect_on_panorama_mousemove(e) {
        return this.selrect.onmousemove(e);
      },

      on_panorama_mouseup: function selrect_on_panorama_mouseup(e) {
        return this.selrect.onmouseup(e);
      }


    }); // selrect

    panorama.selrect=jq.selrect;

  }, // region_init


  /**
   * Region.on_selrect_init()
   *
   * selrect_init event handler
   *
   */
  on_selrect_init: function region_on_selrect_init(e) {

    var selrect=this;

    // selrect instance needs to receive Panorama mouse events
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

    var selrect=this;

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
    if (region.dispatch({
      type: 'mouseup',
      selrect: selrect

    })!==false) {
      // region.persistent and region.resizable are false 

      // selrect instance does not need to receive Panorama events anymore
      Panorama.prototype.dispatchEventsTo(selrect,{dispose: true});

      // selrect div is not needed anymore
      $(selrect.div).remove();
    }

    return false;

  }, // region_on_selrect_mouseup

  /**
   * Region.onmouseup()
   *
   * region_mouseup event handler
   *
   */
  onmouseup: function region_onmouseup(e) {

    var region=this;

    if (!region.persistent && !region.resizable) {

      // trigger region_ready event
      region.dispatch({
        type: 'ready',
        selrect: e.selrect
      });

      // dispose selrect.div
      return false;
    }

    if (region.persistent && !region.resizable) {

      // trigger region_ready event
      region.dispatch({
        type: 'ready',
        selrect: e.selrect
      });

      // preserve selrect.div
      return;
    }

    // region is resizable
    region.selrect.mode.resize=true;
      // dispose selrect.div

  } // region_onmouseup

});

// add Region object constructor to Panorama.prototype
Panorama.prototype.Region=Region;

})(jQuery,Panorama);

// Region instances need to emit events
setupEventDispatcher(Panorama.prototype.Region.prototype);

