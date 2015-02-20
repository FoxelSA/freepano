/*
 * freepano - WebGL panorama viewer
 *
 * Copyright (c) 2014,2015 FOXEL SA - http://foxel.ch
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

  // initialise sound list and instantiate sounds
  init: function soundList_init() {
    var soundList=this;

    if (soundList.panorama) {
      // this sound list is bound to panorama
      if (!soundList.panorama.sound || soundList.panorama.sound!=soundList){
        soundList.panorama.sound=soundList;
      }
    } else if (soundList.widget) {
      // this sound list is bound to a widget
      if (!soundList.widget.sound || soundList.widget.sound!=soundList){
        soundList.widget.sound=soundList;
      }
    } else {
      console.log('SoundList.init: Cannot initialize sound list. Where are we bound ?');
    }

    $.each(soundList.list,function(name){
      var sound=this;
      if (!(sound instanceof Sound)) {
        soundList.list[name]=new Sound($.extend(true,{},soundList.defaults,sound,{
          soundList: soundList
        }));
      }
    }); // each soundList.list

  }, // soundList_init

  set_position_howler: function soundList_set_position_howler(panorama,object3D){
    var sound=this;

    var pos=object3D.position.clone();
    pos.applyMatrix4(panorama.camera.instance.matrixWorldInverse);
    pos.normalize();
    pos.multiplyScalar(object3D.position.length());

    var v=new THREE.Vector3(pos.x,pos.y,pos.z).normalize();
    v.z=1;
    v.normalize();
   
    var widget=sound.widget;
    $.each(sound.list,function(name){
      var soundList_elem=sound.list[name];
      if (soundList_elem.instance) {
        soundList_elem.instance.pos(
          pos.x,
          pos.y,
          pos.z
        );
        soundList_elem.instance.orientation(v.x,v.y,v.z);
      }
    });
  }, // soundList_set_position_howler

  on_panorama_ready: function soundList_on_panorama_ready(panorama_event) {
    var panorama=this;
    Howler.orientation(0,0,-1,0,1,0);
  },

  on_panorama_dispose: function soundList_on_panorama_dispose(panorama_event) {

    var panorama=this;
    var sound=panorama.sound;

    if (!sound) {
      return;
    }

    $.each(sound.list,function(name,soundList_elem){
      if (soundList_elem.instance) soundList_elem.dispose();
    });

  }, // soundList_on_panorama_dispose

  on_panorama_preinit: function soundList_on_panorama_preinit(e) {

    // sound lists can be bound to Widget instances
    $.each(window.widgetTypes,function(idx,widgetType){

      var Widget=window[widgetType];

      widgetType=widgetType.toLowerCase();

      Widget.prototype.dispatchEventsTo(SoundList.prototype);

      SoundList.prototype['on_'+widgetType+'_dispose']=function soundList_on_widget_dispose(widget_event) {

        var widget=this;
        var sound=widget.sound;

        if (!sound) {
          return;
        }

        $.each(sound.list,function(name,soundList_elem){
          if (soundList_elem.instance) soundList_elem.dispose();
        });

      } // soundList_on_widget_dispose

      SoundList.prototype['on_'+widgetType+'_preinit']=function soundList_widget_preinit_handler() {

          var widget=this;

          // skip SoundList instantiation if sound preferences undefined in widget
          if (widget.sound!==undefined) {

            // or if sound list is already instantiated
            if (!(widget.sound instanceof SoundList)) {

              // intantiate sound list
              widget.sound=new SoundList($.extend(true,{

                // pass widget instance pointer to sound instance
                widget: widget

              },widget.sound));
            }
          }

      } // soundList_widget_preinit_handler

      Widget.prototype.dispatchEventsTo(Sound.prototype);
      Sound.prototype['on_'+widgetType+'_update']=function sound_set_position_on_widget_update() {
        var widget=this;
        var sound=widget.sound;
        if (!sound) {
          return;
        }
        var set_position_method='set_position_'+sound.type;
        if (sound[set_position_method]) {
          sound[set_position_method](widget.panorama,widget.object3D);
        }
      } // sound_set_position_on_widget_update

      Sound.prototype.dispatchEventsTo(Widget.prototype);
      Widget.prototype.on_sound_play=function widget_set_sound_position_on_sound_play(e) {
        var sound=this;
        var widget=sound.soundList.widget;
        if (!widget) {
          return;
        }
        var set_position_method='set_position_'+sound.type;
        if (sound[set_position_method]) {
          sound[set_position_method](widget.panorama,widget.object3D);
        }
      } // widget_set_sound_position_on_sound_play

    });

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

  } // soundList_on_panorama_preinit

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
    type: 'howler',
    fadeOut: 0
  }, // Sound defaults

  options: {

    // redirect sound.type specific event handlers calls to sound instance via sound.callback
    howler: {
      onload: function howler_onload() {
        this.soundList_elem.dispatch('load');
      },
      onloaderror: function howler_onloaderror() {
        this.soundList_elem.dispatch('loaderror');
      },
      onpause: function howler_onpause() {
        this.soundList_elem.dispatch('pause');
      },
      onplay: function howler_onplay() {
        this.soundList_elem.dispatch('play');
      },
      onend: function howler_onend() {
        this.soundList_elem.dispatch('end');
      }
    }
  }, // Sound.options

  init: function sound_init(){
    var sound=this;
    try {
      sound.instance=sound['new_'+sound.type]();
    } catch(e) {
      $.notify('Cannot instantiate sound of type '+sound.type);
    }
  }, // sound_init

  dispose: function sound_dispose() {
    var sound=this;
    sound['dispose_'+sound.type](function(){
      sound.instance=null;
    });
  }, // sound_dispose

  cmd: function sound_cmd(cmd,args) {
    var sound=this;
    var args=(args)?Array.prototype.slice.apply(args):[];
    if (sound.instance[cmd+'_'+sound.type]) {
      sound[cmd+'_'+sound.type].apply(sound,args);
    } else if (sound.instance[cmd]) {
      sound.instance[cmd].apply(sound.instance,args);
    } else {
      console.log('unknown command "'+cmd+'" for '+sound)
    }
  },

  pause: function sound_pause() {
    this.cmd('pause',arguments);
  },

  fade: function sound_fade() {
    this.cmd('fade',arguments);
  },

  stop: function sound_stop() {
    this.cmd('stop',arguments);
  },

  new_howler: function sound_newHowler() {
    var sound=this;
    try {
      sound.instance=new Howl($.extend(true,{},sound.options[sound.type],sound));
      sound.instance.soundList_elem=sound;
    } catch (e) {
      console.log(e)
    }
    if (sound.panner) {
      sound.instance.pannerAttr(sound.panner);
    }
    return sound.instance;
  }, // sound_newHowler

  dispose_howler: function sound_disposeHowler(callback) {

    var sound=this;
    if (!sound.instance) {
      return;
    }

    try {
      sound.instance
      .off('faded')
      .on('faded',function(){
        sound.instance.unload();
        callback();
      })
     .fade(/*from*/ sound.instance.volume(), /*to*/ 0, /*duration*/ sound.fadeOut);
    } catch(e) {
      console.log(e);
    }

  }, // sound_disposeHowler

  set_position_howler: function sound_set_position_howler(panorama,object3D){
    var sound=this;
    if (!sound.instance) {
      return;
    }
    var pos=object3D.position.clone();
    pos.applyMatrix4(panorama.camera.instance.matrixWorldInverse);
    pos.normalize();
    pos.multiplyScalar(object3D.position.length());

    var v=new THREE.Vector3(pos.x,pos.y,pos.z).normalize();
    v.z=1;
    v.normalize();
    sound.instance.pos(
      pos.x,
      pos.y,
      pos.z
    );
    sound.instance.orientation(v.x,v.y,v.z);

  } // sound_set_position_howler

/*
  updateConeEffect: function sound_updateConeEffect(pos) {
    var sound=this;
    if (sound.innerAngle) {
      var v=new THREE.Vector3(pos.x,pos.y,pos.z).normalize();
      var alpha=Math.abs(v.angleTo(new THREE.Vector3(0,0,-1))/(Math.PI/180));
      var gain;
      if (alpha<sound.innerAngle) {
        gain=1;
      } else if (alpha>=sound.outerAngle) {
        gain=sound.outerGain;
      } else {
        var n=(alpha-sound.innerAngle)/(sound.outerAngle-sound.innerAngle);
        gain=(1-n)+sound.outerGain*n;
      }
//      if (sound.instance._volume!=gain) {
//        sound.instance.volume(gain);
//      }
      sound.coneEffect=gain;
    }
  } // sound_updateConeEffect
*/

}); // extend Sound.prototype

setupEventDispatcher(SoundList.prototype);
setupEventDispatcher(Sound.prototype);
Panorama.prototype.dispatchEventsTo(SoundList.prototype);
