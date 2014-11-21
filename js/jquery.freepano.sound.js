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


// SoundList constructor
function SoundList(options) {

  if (!(this instanceof SoundList)) {
    return new SoundList(options);
  }

  $.extend(true,this,this.defaults,options);
  this.init();

} // SoundList

$.extend(true,SoundList.prototype,{

  defaults: {
    type: 'howler'
  }, // SoundList defaults

  init: function soundList_init() {
    var soundList=this;
    $.each(soundList.list,function(name){
      var sound=this;
      if (!(sound instanceof Sound)) {
        soundList.list[name]=new Sound(sound);
      }
    }); // each soundList.list
  }, // soundList_init

  callback: function soundList_callback(soundList_event) {
    var soundList=this;
    if (!soundList['on'+soundList_event.type]) {
      console.log('unhandled soundList_event: '+soundList_event.type);
      return;
    }
    soundList['on'+soundList_event.type](soundList_event);
  }, // soundList_callback

  set_position_howler: function soundList_set_position_howler(pos){
    var sound=this
    $.each(sound.list,function(name){
      var soundList_elem=sound.list[name];
      if (soundList_elem.instance) {
        soundList_elem.instance.pos3d(
          pos.x,
          pos.y,
          pos.z
        );
      }
    });
  },

  on_panorama_dispose: function soundList_on_panorama_dispose(panorama_event) {

    var panorama=this;
    var sound=panorama.sound;

    if (!sound) {
      return;
    }

    $.each(sound.list,function(name,soundList_elem){
        soundList_elem.dispose();
    });

  }, // soundList_on_panorama_dispose

  panorama_prototype_init: Panorama.prototype.init,
  panorama_prototype_callback: Panorama.prototype.callback,
  poi_prototype_init: POI.prototype.init,
  poi_prototype_callback: POI.prototype.callback

}); // extend SoundList.prototype

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
      },
      onend: function howler_onend() {
        Sound.prototype.callback({type:'end'});
      }
    }
  },

  init: function sound_init(){
    var sound=this;
    try {
      sound.instance=sound['new_'+sound.type]();
    } catch(e) {
      $.notify('Cannot instantiate sound of type '+sound.type);
    }
  },

  new_howler: function sound_newHowler() {
    var sound=this;
    return new Howl($.extend(true,{},sound.options[sound.type],sound));
  },

  callback: function sound_callback(sound_event) {
    var sound=this;
    if (sound['on'+sound_event.type]) {
      sound['on'+sound_event.type](sound_event);
    } else {
      console.log('unhandled sound event: '+sound_event.type,sound);
    }
  }

}); // extend Sound.prototype

// sound lists can be bound to panorama instances
$.extend(true,Panorama.prototype,{

  // initialize sound list on panorama init
  init: function panorama_prototype_init_hook() {

    var panorama=this;

    // skip sound list instantiation if "sound" undefined in panorama
    if (panorama.sound!==undefined) {
     
      // or if sound list is already instantiated
      if (!(panorama.sound instanceof SoundList)) {
     
        // instantiate sound list
        panorama.sound=new SoundList($.extend(true,{
     
          // pass panorama instance pointer to sound instance
          panorama: panorama,
     
        },panorama.sound));
      }
    }

    SoundList.prototype.panorama_prototype_init.call(panorama);

  }, // panorama_prototype_init_hook
       
  // hook to Panorama.prototype.callback
  callback: function soundList_panorama_prototype_callback(e) {
       
    var panorama=this;

    // forward panorama event to sound list object
    var method='on_panorama_'+e.type;
    if (panorama.sound && panorama.sound[method]) { 
      panorama.sound[method].apply(panorama,[e]);
    }
       
    // chain with old panorama.prototype.callback
    SoundList.prototype.panorama_prototype_callback.apply(panorama,[e]);
       
  } // soundList_panorama_prototype_callback

});  // extend Panorama.prototype for SoundList

// sound lists can be bound to POI instances
$.extend(true,POI.prototype,{
      
  init: function poi_prototype_init_hook() {

    var poi=this;

    // skip SoundList instantiation if sound preferences undefined in poi
    if (poi.sound!==undefined) {
     
      // or if sound list is already instantiated
      if (!(poi.sound instanceof SoundList)) {
     
        // intantiate sound list
        poi.sound=new SoundList($.extend(true,{
     
          // pass poi instance pointer to sound instance
          poi: poi

        },poi.sound));

        poi.sound.on_poi_update=function soundList_set_position_on_poi_update() {
          var poi=this;
          var sound=poi.sound;
          var set_position_method='set_position_'+sound.type;
          if (sound[set_position_method]) {
            sound[set_position_method](poi.object3D.position);
          }
        }

      }
    }

    SoundList.prototype.poi_prototype_init.call(poi);
     
  },

  // hook to POI.prototype.callback
  callback: function poi_prototype_callback_hook(e) {
       
    var poi=this;

    // forward poi event to sound list object
    var method="on_poi_"+e.type;
    if (poi.sound && poi.sound[method]) {
      poi.sound[method].apply(poi,[e]);
    }
       
    // chain with old poi.prototype.callback
    SoundList.prototype.poi_prototype_callback.apply(poi,[e]);
       
  }, // poi_prototype_callback_hook

       
}); // extend Panorama.prototype for SoundList

