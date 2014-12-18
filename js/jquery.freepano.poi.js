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

if (typeof(PanoList)!="undefined") {
  alert("jquery.freepano.list.js must be loaded after jquery.freepano.poi.js !")
}

function POI(options){
  if (!(this instanceof POI)) {
    return new POI(options)
  }
  $.extend(true,this,POI.prototype.defaults,options);
  this.init();
}

$.extend(true, POI.prototype, {

  defaults: {
    mesh: null,
    radius: Math.PI ,
    coords: {
      lon: 0,
      lat: 90
    },
    size: Math.PI/36
  },

  // initialize poi and add to panorama scene
  init: function poi_init() {

    var poi=this;
    var panorama=poi.panorama;

    // create object3D if undefined
    if (!poi.object3D) {
      // create mesh if undefined
      if (!poi.mesh) {
        poi.mesh=poi.defaultMesh();
      }
      poi.object3D=new THREE.Object3D();
      poi.object3D.add((typeof(poi.mesh)=="function")?poi.mesh():poi.mesh);
    } else {
      if (typeof(poi.object3D)=="function") {
        poi.object3D=poi.object3D();
      }
    }

    // add to scene
    panorama.scene.add(poi.object3D);

    poi.callback({
        type: 'ready',
        target: poi
    });

  }, // poi_init

  dispose: function poi_dispose(){

    var poi=this;
    var panorama=poi.panorama;

    if (poi.object3D) {
      panorama.scene.remove(poi.object3D);
      poi.object3D=null

    }
    if (typeof(poi.mesh)=="object") {
      poi.mesh=null;
    }

  }, // poi_dispose

  // callback other classes can hook to
  callback: function poi_callback(poi_event) {

    var poi=this;

    switch (poi_event.type){

    case 'ready':
      poi.object3D.name=poi.name;
      $.each(poi.object3D.children,function(index,mesh){
        poi.panorama.poi.meshes.push(this);
      });
      break;
    case 'dispose':
      poi.dispose();
      break;
    }

  }, // poi_callback

  // create default mesh
  defaultMesh: function poi_defaultMesh() {
     var poi=this;
     var circle=new THREE.Mesh(new THREE.CircleGeometry(poi.size,100), new THREE.MeshBasicMaterial({
           color: 0x000000,
           transparent: true,
           opacity: 0.3
     }));
     return circle;
  }, // poi_defaultMesh

  // update poi display properties and coordinates

  update: function poi_update() {
    var poi=this;
    var panorama=poi.panorama;

    // set poi model view matrix to identity
    poi.mv=new THREE.Matrix4();

    // rotation around vertical axis
    poi.mv.multiply(new THREE.Matrix4().makeRotationY(-poi.coords.lon*Math.PI/180));

    // rotation around horizontal axis
    poi.mv.multiply(new THREE.Matrix4().makeRotationX(-poi.coords.lat*Math.PI/180));

    // compute poi coords
    poi.coords.vec4=new THREE.Vector4(0,0,-poi.radius,1);
    poi.coords.vec4.applyMatrix4(poi.mv);
    poi.coords.vec4.applyMatrix4(poi.panorama.rotation.matrix);

      poi.coords.vec4.applyMatrix4(panorama.viewRotationMatrix);
//    poi.coords.vec4.applyMatrix4(new THREE.Matrix4().makeRotationY(panorama.lon*Math.PI/180));
//    poi.coords.vec4.applyMatrix4(new THREE.Matrix4().makeRotationX(panorama.lat*Math.PI/180));


    poi.object3D.position.x=poi.coords.vec4.x/poi.coords.vec4.w;
    poi.object3D.position.y=poi.coords.vec4.y/poi.coords.vec4.w;
    poi.object3D.position.z=poi.coords.vec4.z/poi.coords.vec4.w;

    poi.object3D.lookAt(new THREE.Vector3(0,0,0));
//    poi.object3D.rotation.setFromRotationMatrix(new THREE.Matrix4().makeRotationY(-panorama.lon*2*Math.PI/180));

    poi.callback({
        type:'update',
        target: poi
    });

  }, // poi_update

  getCoords3D: function poi_getCoords3D(){
    var poi=this;
    var x=poi.object3D.position.x;
    var y=poi.object3D.position.y;
    var z=poi.object3D.position.z;
    // rectangular to polar coordinates
    var r=Math.sqrt(x*x+y*y+z*z);
    var phi=Math.acos(z/r);
    var theta=Math.atan2(y,x);
    // back to rectangular coordinates (to set distance from camera)
    return [
      -poi.radius*Math.sin(phi)*Math.cos(theta),
      -poi.radius*Math.sin(phi)*Math.sin(theta),
      -poi.radius*Math.cos(phi)
    ];
  }, // poi_getCoords3D

  mousein: function poi_mousein(e) {
    console.log('mousein',this);
  },

  mouseout: function poi_mouseout(e) {
    console.log('mouseout',this);
  },

  mouseover: function poi_mouseover(e) {
  },

  mousedown: function poi_mousedown(e) {
    console.log('mousedown',this);
  },

  mouseup: function poi_mouseup(e) {
    console.log('mouseup',this);
  },

  click: function poi_click(e) {
    console.log('click',this);
  },

  _mousedown: function _poi_mousedown(e){

    var poi=this;
    var poi_list=poi.panorama.poi;

    // set poi mode to active
    poi_list._active=poi;
    this.setColor(this.color.active);

    // restore poi color on mouseup
    $(document).on('mouseup.poi_mousedown',function(){
      if (poi_list._active) {
        if (poi.color && poi_list.hover.length && poi_list.hover[0].object.parent.name==poi_list._active.name) {
          poi.setColor(poi.color.hover);
          poi.panorama.drawScene();
        } else {
          poi.setColor(poi.color.normal);
          poi.panorama.drawScene();
        }
        poi_list._active=null;
      }
      $(document).off('mouseup.poi_mousedown');
    });

  }, // _poi_mousedown

  _mouseup: function _poi_mouseup(e){
    this.setColor(this.color.hover);
  }, // _poi_mouseup

  _mousein: function _poi_mousein(e){
    if (!this.color || this.panorama.mode.rotate) return;
    this.panorama.poi._hover=this;
    if (this.panorama.poi._active) {
      if (this.panorama.poi._active==this) {
        this.setColor(this.color.active);
      }
      return;
    }
    this.setColor(this.color.hover);
  }, // _poi_mousein

  _mouseout: function _poi_mouseout(e){
    if (!this.color || this.panorama.mode.rotate) return;
    this.panorama.poi._hover=null;
    this.setColor(this.color.normal);
  }, // _poi_mouseout

  setColor: function poi_setColor(color) {
    $.each(this.object3D.children,function(){
      this.material.color.set(color);
    });
    this.panorama.drawScene();
  }, // poi_setColor

  scale: function poi_scale(scaleFactor) {
    if (scaleFactor instanceof THREE.Vector3) {
      this.object3D.scale.x=scaleFactor.x;
      this.object3D.scale.y=scaleFactor.y;
      this.object3D.scale.z=scaleFactor.z;
    } else {
      this.object3D.scale.x=scaleFactor;
      this.object3D.scale.y=scaleFactor;
      this.object3D.scale.z=scaleFactor;
    }
    this.panorama.drawScene();
  } // poi_scale

}); // extend POI.prototype

function POI_list(options) {
    if (!(this instanceof POI_list)) {
      return new POI_list(options)
    }
    $.extend(true,this,POI_list.prototype.defaults,options);
    this.init();
}

$.extend(true, POI_list.prototype, {

    defaults: {
    },

    // save pointer to Panorama.prototype.init in POI_list.prototype
    panorama_prototype_init: Panorama.prototype.init,

    // save pointer to Panorama.prototype.callback in POI_list.prototype
    panorama_prototype_callback: Panorama.prototype.callback,

    // save pointer to Panorama.prototype.mousedown in POI_list.prototype
    panorama_prototype_mousedown: Panorama.prototype.mousedown,

    init: function poiList_init() {

      var poi_list=this;
      var panorama=poi_list.panorama;

      if (panorama.poi!=poi_list) {
        // needed when switching panoramas for obscure reason
        panorama.poi=poi_list;
      }

      if (!panorama.scene) {
        console.log('panorama.scene is undefined, cannot create POIs');
        return;
      }

      // setup poi mouse event detection
      if (!(panorama.poi.raycaster instanceof THREE.Raycaster)) {
        panorama.poi.raycaster=new THREE.Raycaster(panorama.poi.raycaster);
      }
      $('canvas:first',panorama.container).off('.poi_list').on('mousemove.poi_list mousedown.poi_list mouseup.poi_list click.poi_list',function(e) {
        if (panorama.poi) {
          return panorama.poi['on_panorama_'+e.type](e);
        }
      });

      // clear POI mesh list
      poi_list.meshes=[];

      // instantiate POIs
      $.each(poi_list.list,function(name) {
        var poi=this;
        poi_list.list[name].instance=null;
        poi_list.list[name].instance=new POI($.extend(true,{},poi_list.defaults,poi,{
          name: name,
          panorama: panorama
        }));
      });

      poi_list.callback({type: 'init'});

    }, // poiList_init

    mesh_list_update: function poiList_mesh_list_update() {
      var poi_list=this;
      poi_list.meshes=[];
      $.each(poi_list.list,function(name,poi) {
        $.each(poi.object3D.children,function(index,mesh){
          poi_list.meshes.push(this);
        });
      });
    }, // poiList_mesh_list_update

    on_panorama_update: function poiList_on_panorama_update(e) {

      var panorama=this;

      if (!panorama.poi) {
        return;
      }

      // update poi list on panorama 'update' event
      $.each(panorama.poi.list,function poi_update() {
        var poiList_elem=this;
        if (poiList_elem.instance) {
          poiList_elem.instance.update();
        }
      });

    }, // poiList_on_panorama_update

    on_panorama_dispose: function poiList_on_panorama_dispose(e) {

      var panorama=this;
      if (!panorama.poi) {
        return;
      }

      // remove poi objects from scene
      $.each(panorama.poi.list,function poiList_poi_dispose() {
        var poi=this;
        if (poi.instance){
          poi.instance.callback({type: 'dispose'});
          poi.instance=null;
        }
      });

      panorama.poi=null;

    }, // poiList_on_panorama_dispose

    // initialize or instantiate poi list
    on_panorama_ready: function poiList_on_panorama_ready(e) {

      var panorama=this;
      if (panorama.poi instanceof POI_list) {
        panorama.poi.init();

      } else {
        panorama.poi=new POI_list($.extend(true,{
          panorama: panorama
        },panorama.poi));
      }

    }, // poiList_on_panorama_ready

    hover: [],

    on_panorama_mousemove: function poiList_on_panorama_mousemove(e) {

      var poi_list=this;
      var panorama=this.panorama;

      if (e.pageX!=undefined) {
        // save mouse position
        panorama.pageX=e.pageX;
        panorama.pageY=e.pageY;
        panorama.clientX=e.clientX;
        panorama.clientY=e.clientY;
      } else {
        // use saved mouse position
        e.pageX=panorama.pageX;
        e.pageY=panorama.pageY;
        e.clientX=panorama.clientX;
        e.clientY=panorama.clientY;
      }

      var hover=poi_list.get_mouseover_list(e);

      // if mouse is hovering a poi now
      if (hover.length) {

        // if mouse was hovering a poi before
        if (poi_list.hover.length) {

          // and it is the same one
          if (poi_list.hover[0].object.parent.name==hover[0].object.parent.name) {

            // then trigger mouseover for the poi and return
            poi_list.list[hover[0].object.parent.name].instance.mouseover(e);
            return;

          } else {
            // not the same one, trigger mouseout and continue
            poi_list.list[poi_list.hover[0].object.parent.name].instance._mouseout(e);
            poi_list.list[poi_list.hover[0].object.parent.name].instance.mouseout(e);
          }
        }

        // store current hover list
        poi_list.hover=hover;

        // trigger mousein and mouseover for the poi mouse is hovering now
        poi_list.list[hover[0].object.parent.name].instance._mousein(e);
        poi_list.list[hover[0].object.parent.name].instance.mousein(e);
        poi_list.list[hover[0].object.parent.name].instance.mouseover(e);

      } else {
        // no hover now, but if mouse was hovering a poi before
        if (poi_list.hover.length) {

            // trigger mouseout and return
            poi_list.list[poi_list.hover[0].object.parent.name].instance._mouseout(e);
            poi_list.list[poi_list.hover[0].object.parent.name].instance.mouseout(e);
            poi_list.hover=[];
            return;
        }
      }

    }, // poiList_on_panorama_mousemove

    on_panorama_mouseevent: function poiList_on_panorama_mousevent(e) {

      var poi_list=this;

      if (poi_list.hover.length) {

      // call handlers for first poi from hovering list
      var poi=poi_list.list[poi_list.hover[0].object.parent.name].instance;

      // 1. private mouseevent handler (for hover / active color handling)
      if (poi['_'+e.type] && poi.color) {
        poi['_'+e.type](e);
      }

      // 2. public mouseevent handler
        return poi[e.type](e);
      }
    }, // poiList_on_panorama_mouseevent

    get_mouseover_list: function poiList_get_mouseover_list(e) {

      var panorama=this.panorama;
      var container=$(panorama.container);
      var camera=panorama.camera.instance;
      var raycaster=panorama.poi.raycaster;

      // convert screen coordinates to normalized coordinates
      var vector=new THREE.Vector3();
      vector.set(
        (e.clientX-container.offset().left)/container.width()*2-1,
       -(e.clientY-container.offset().top)/container.height()*2+1,
       0.5
      );

      // convert normalized coordinates to world coordinates
      vector.unproject(camera);

      // create a ray from camera.position to world coordinates
      raycaster.ray.set(camera.position, vector.sub(camera.position).normalize());

      // find meshes intersecting with this ray
      return raycaster.intersectObjects(panorama.poi.meshes);

    }, // poiList_get_mousover_list

    callback: function poiList_callback(poiList_event) {
    }

});

$.extend(true,POI_list.prototype,{
    on_panorama_mousedown: POI_list.prototype.on_panorama_mouseevent,
    on_panorama_mouseup: POI_list.prototype.on_panorama_mouseevent,
    on_panorama_click: POI_list.prototype.on_panorama_mouseevent
});

$.extend(true,Panorama.prototype,{

  init: function poiList_panorama_init() {

      var panorama=this;

      // skip POI_list instantiation if poi list preferences undefined in panorama
      if (panorama.poi!==undefined) {

        // or if poi list is already instantiated
        if (!(panorama.poi instanceof POI_list)) {

          // instantiate poi list
          panorama.poi=new POI_list($.extend(true,{

            // pass panorama instance pointer to poi list instance
            panorama: panorama,

          },panorama.poi));
        }
      }

      // chain with old panorama.prototype.init
      POI_list.prototype.panorama_prototype_init.call(panorama);

  }, // poiList_panorama_init

  // hook to Panorama.prototype.callback
  callback: function poiList_panorama_prototype_callback(e) {

    var panorama=this;

    if (panorama.poi){
      if (panorama.poi['on_panorama_'+e.type]) {
        panorama.poi['on_panorama_'+e.type].apply(panorama,[e]);
      } else {
        if (POI_list.prototype['on_panorama_'+e.type]) {
          POI_list.prototype['on_panorama_'+e.type].apply(panorama,[e]);
        }
      }
    }

    // chain with old panorama.prototype.callback
    POI_list.prototype.panorama_prototype_callback.apply(panorama,[e]);

  }, // poiList_panorama_prototype_callback

  // hook to Panorama.prototype.mousedown
  mousedown: function poiList_panorama_prototype_mousedown(e) {

    var panorama=this;

    // call previous panorama.prototype.callback
    var ret=POI_list.prototype.panorama_prototype_mousedown.apply(panorama,[e]);

    // unset panorama.mode.rotate when mousedown activated a poi
    if (panorama.poi && panorama.poi._active){
      panorama.mode.rotate=false;
    }

    return ret;

  }

}); // extend Panorama.prototype

