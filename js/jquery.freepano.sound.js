/*
 * freepano - WebGL panorama viewer
 *
 * Copyright (c) 2014 FOXEL SA - http://foxel.ch
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


// Sound constructor

function Sound(options) {

  if (!(this instanceof Sound)) {
    return new Sound(options);
  }

  $.extend(true,this,this.defaults,options);
  this.init();

} // Sound

$.extend(true,Sound.prototype,{

  defaults: {
    type: 'howler'
  }, // Sound defaults

  options: {
    howler: {
      onload: function howler_onload() {
        Sound.prototype.callback({type:'load'});

      },
      onloaderror: function howler_onloaderror() {
        Sound.prototype.callback({type:'loaderror'});
      },
      onpause: function howler_onpause() {
        Sound.prototype.callback({type:'pause'});
      },
      onplay: function howler_onplay() {
        Sound.prototype.callback({type:'play'});
      }
    }
  },

  init: function sound_init(){
    var sound=this;
    if (!sound.options[sound.type]) {
      $.notify('Sound type "'+sound.type+'" unsupported !');
      return;
    }
    sound.instance=new Howl($.extend(true,{},sound.options[sound.type]));
  },

  callback: function sound_callback(sound_event) {
    var sound=this;
    if (sound['on'+sound_event.type]) {
      sound['on'+sound_event.type](sound_event);
    } else {
      console.log('unhandled sound event: '+sound_event.type,sound);
    }
  },

  panorama_prototype_init: Panorama.prototype.init,
  panorama_prototype_callback: Panorama.prototype.callback,
  poi_prototype_init: POI.prototype.init,
  poi_prototype_callback: POI.prototype.callback

}); // extend Sound.prototype

// sounds can be bound to panorama instances
$.extend(Panorama.prototype,{

  // initialize sound on panorama init
  init: function panorama_prototype_init_hook() {

    var panorama=this;

    // skip sound instantiation if sound preferences undefined in panorama
    if (panorama.sound!==undefined) {
     
      // or if sound is already instantiated
      if (!(panorama.sound instanceof Sound)) {
     
        // instantiate sound
        panorama.sound=new Sound($.extend(true,{
     
          // pass panorama instance pointer to sound instance
          panorama: panorama,
     
        },panorama.sound));
      }
    }
    Sound.prototype.panorama_prototype_init.call(panorama);
  }, // panorama_prototype_init_hook
       
  // hook to Panorama.prototype.callback
  callback: function panorama_prototype_callback_hook(e) {
       
    var panorama=this;
    if (panorama.sound) {

      $.each(panorama.sound.list,function sound_panorama_event_propagate(name){

        var soundList_elem=this;

        if (soundList_elem.instance && soundList_elem.instance['on_panorama_'+e.type]) {
          soundList_elem.instance['on_panorama_'+e.type](e);
        }

      });

    } // if panorama.sound
       
    // chain with old panorama.prototype.callback
    Sound.prototype.panorama_prototype_callback.apply(panorama,[e]);
       
  } // panorama_prototype_callback_hook

});  // extend Panorama.prototype

// sounds can be bound to POI instances
$.extend(POI.prototype,{
      
  init: function poi_prototype_init_hook() {

    var poi=this;

    // skip Sound instantiation if sound preferences undefined in poi
    if (poi.sound!==undefined) {
     
      // or if sound is already instantiated
      if (!(poi.sound instanceof Sound)) {
     
        // intantiate sound
        poi.sound.instance=new Sound($.extend(true,{
     
          // pass poi instance pointer to sound instance
          poi: poi,
     
        },poi.sound));
      }
    }

    Sound.prototype.poi_prototype_init.call(poi);
     
  },

  // hook to POI.prototype.callback
  callback: function poi_prototype_callback_hook(e) {
       
    var poi=this;
    if (poi.sound) {
      $.each(poi.sound.list,function sound_poi_event_propagate() {
        var sound_elem=this;
        if (sound_elem.instance && sound_elem.instance['on'+e.type]) {
          return sound_elem.instance['on'+e.type](e);
        }
      });
    }
       
    // chain with old poi.prototype.callback
    Sound.prototype.poi_prototype_callback.apply(poi,[e]);
       
  } // poi_prototype_callback_hook
       
}); // extend Panorama.prototype

