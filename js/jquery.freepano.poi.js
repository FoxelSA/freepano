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


    console.log(poi.object3D.position);

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
      callback: function() {}
    },

    init: function POI_list_init() {
      var poi_list=this;
      $(poi_list.panorama).off('.poi_list').on('panoready.poi_list',function(e){
        var panorama=e.target;
        var poi=panorama.poi_list.list;
        $.each(poi,function(name) {
          poi[name].instance=null;
          poi[name].instance=new POI($.extend(true,poi[name],{
            panorama: panorama
          }));
        });
      });
      poi_list.callback();
    },
});

$.extend(POI_list.prototype,{
    // save pointer to Panorama.prototype.callback in POI_list.prototype
    panorama_prototype_callback: Panorama.prototype.callback
});

$.extend(Panorama.prototype,{

  // hook to Panorama.prototype.callback
  callback: function panorama_prototype_callback_hook(e) {

    var panorama=this;

    switch(e.type){

    // initialize poi list on panorama 'ready' event
    case 'ready':

      // skip POI_list instantiation if poi_list preferences undefined in panorama
      if (panorama.poi_list!==undefined) {

        // or if poi_list is already instantiated
        if (!(panorama.poi_list instanceof POI_list)) {

          // intantiate poi_list
          panorama.poi_list=new POI_list($.extend(true,{

            // pass panorama instance pointer to poi_list instance
            panorama: panorama,

          },panorama.poi_list));
        }
      }

      break;

    case 'update': 

      // update poi list on panorama 'update' event
      $.each(panorama.poi_list.list,function update_poi() {
        var poiList_elem=this;
        poiList_elem.instance.update();
      });

      break;

    } // switch e.type

    // chain with old panorama.prototype.callback
    panorama.poi_list.panorama_prototype_callback(e);

  } // panorama_prototype_callback_hook

}); // extend Panorama.prototype

