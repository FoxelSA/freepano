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
    size: Math.PI/36,
    callback: function poi_callback(poi_event) {
    }
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
      poi.object3D.add(poi.mesh);
    }

    // add to scene
    panorama.scene.add(poi.object3D);

    poi.callback({
        type:'ready',
        target: poi
    });

  }, // poi_init

  // create default mesh
  defaultMesh: function poi_defaultMesh() {
     var poi=this;
     var sphere=new THREE.Mesh(new THREE.SphereGeometry(poi.size,100,100), new THREE.MeshBasicMaterial({
           color: 0x000000,
           transparent: true,
           opacity: 0.3
     }));
     return sphere;
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


    // translation towards unity vector
//    poi.mv.multiplyVector4(new THREE.Vector4(0,0,poi.radius,1));

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

//    poi.object3D.rotation.setFromRotationMatrix(new THREE.Matrix4().makeRotationY(-panorama.lon*2*Math.PI/180));

    poi.callback({
        type:'update',
        target: poi
    });

  }, // poi_update

  getCoords3D:function(){                                                                                             
    var poi=this;
    var x=poi.mesh.position.x;
    var y=poi.mesh.position.y;
    var z=poi.mesh.position.z;
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
  },
});

function POI_list(options) {
    if (!(this instanceof POI_list)) {
      return new POI_list(options)
    }
    $.extend(true,this,POI_list.prototype.defaults,options);
    this.init();
}

$.extend(true, POI_list.prototype, {

    defaults: {
      callback: function(e) {}
    },

    init: function POI_list_init() {
      var poi_list=this;
      var panorama=poi_list.panorama;
      if (panorama.scene) {
        $.each(panorama.poi.list,function(name) {
          var poi=this;
          poi.instance=null;
          poi.instance=new POI($.extend(true,poi,{
            panorama: panorama
          }));
        });
        poi_list.callback({type: 'init'});
      } else {
        poi_list.on_panorama_ready=function(e) {
          var panorama=this;
          panorama.poi.init();
        }
      }
    },
});

$.extend(POI_list.prototype,{

    // save pointer to Panorama.prototype.init in POI_list.prototype
    panorama_prototype_init: Panorama.prototype.init,

    // save pointer to Panorama.prototype.callback in POI_list.prototype
    panorama_prototype_callback: Panorama.prototype.callback,

    on_panorama_update: function poiList_on_panorama_update(e) {

      var panorama=this;

      if (!panorama.poi) {
        return;
      }

      // update poi list on panorama 'update' event
      $.each(panorama.poi.list,function update_poi() {
        var poiList_elem=this;
        poiList_elem.instance.update();
      });
    }

});

$.extend(Panorama.prototype,{

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

  },

  // hook to Panorama.prototype.callback
  callback: function poiList_panorama_prototype_callback(e) {

    var panorama=this;

    if (panorama.poi && panorama.poi['on_panorama_'+e.type]) {
      panorama.poi['on_panorama_'+e.type].apply(panorama,[e]);
    }

    // chain with old panorama.prototype.callback
    POI_list.prototype.panorama_prototype_callback.apply(panorama,[e]);

  } // panorama_prototype_callback_hook

}); // extend Panorama.prototype

