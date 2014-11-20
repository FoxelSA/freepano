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
    size: Math.PI/36,
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

  // callback other classes can hook to
  callback: function poi_callback(poi_event) {
    var poi=this;
    switch (poi_event.type){
    case 'ready':
      poi.mesh.poi_name=poi.name;
      poi.panorama.poi.meshes.push(poi.mesh);
      break;
    }
  }, // poi_callback

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
  }


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
    },

    // save pointer to Panorama.prototype.init in POI_list.prototype
    panorama_prototype_init: Panorama.prototype.init,

    // save pointer to Panorama.prototype.callback in POI_list.prototype
    panorama_prototype_callback: Panorama.prototype.callback,

    init: function poiList_init() {

      var poi_list=this;
      var panorama=poi_list.panorama;

      if (!panorama.scene) {
        console.log('panorama.scene is undefined, cannot create POIs');
        return;
      }

      // clear POI mesh list
      poi_list.meshes=[];

      // instantiate POIs
      $.each(poi_list.list,function(name) {
        var poi=this;
        poi_list.list[name].instance=null;
        poi_list.list[name].instance=new POI($.extend(true,poi,{
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
        poi_list.meshes.push(poi.instance.mesh);
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
      $.each(panorama.poi.list,function poi_dispose() {
        var poi=this;
        if (poi.instance && poi.instance.object3D) {
          panorama.scene.remove(poi.instance.object3D);
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

      var poi_list=$(this).data('pano').poi;
      var hover=poi_list.get_mouseover_list(e);

      // if mouse is hovering a poi now
      if (hover.length) {

        // if mouse was hovering a poi before
        if (poi_list.hover.length) {

          // and it is the same one
          if (poi_list.hover[0].object.poi_name==hover[0].object.poi_name) {

            // then trigger mouseover for the poi and return
            poi_list.list[hover[0].object.poi_name].instance.mouseover(e);
            return;

          } else {
            // not the same one, trigger mouseout and continue
            poi_list.list[poi_list.hover[0].object.poi_name].instance.mouseout(e);
          }
        }

        // store current hover list
        poi_list.hover=hover;

        // trigger mousein and mouseover for the poi mouse is hovering now
        poi_list.list[hover[0].object.poi_name].instance.mousein(e);
        poi_list.list[hover[0].object.poi_name].instance.mouseover(e);

      } else {
        // no hover now, but if mouse was hovering a poi before
        if (poi_list.hover.length) {

            // trigger mouseout and return
            poi_list.list[poi_list.hover[0].object.poi_name].instance.mouseout(e);
            poi_list.hover=[];
            return;
        }
      }

    }, // poiList_on_panorama_mousemove

    on_panorama_mousedown: function poiList_on_panorama_mousedown(e) {
      var poi_list=$(this).data('pano').poi;
      if (poi_list.hover.length) {
        return poi_list.list[poi_list.hover[0].object.poi_name].instance.mousedown(e);
      }
    },

    on_panorama_mouseup: function poiList_on_panorama_mouseup(e) {
      var poi_list=$(this).data('pano').poi;
      if (poi_list.hover.length) {
        return poi_list.list[poi_list.hover[0].object.poi_name].instance.mouseup(e);
      }
    },

    on_panorama_click: function poiList_click(e) {
      var poi_list=$(this).data('pano').poi;
      if (poi_list.hover.length) {
        return poi_list.list[poi_list.hover[0].object.poi_name].instance.click(e);
      }
    },

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

      // setup poi mouse event detection
      if (!(panorama.poi.raycaster instanceof THREE.Raycaster)) {
        panorama.poi.raycaster=new THREE.Raycaster(panorama.poi.raycaster);
      }
      $(panorama.container)
      .on('mousemove.poi_list',panorama.poi.on_panorama_mousemove)
      .on('mousedown.poi_list',panorama.poi.on_panorama_mousedown)
      .on('mouseup.poi_list',panorama.poi.on_panorama_mouseup)
      .on('click.poi_list',panorama.poi.on_panorama_click);

      // chain with old panorama.prototype.init
      POI_list.prototype.panorama_prototype_init.call(panorama);

  },

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

  } // panorama_prototype_callback_hook

}); // extend Panorama.prototype

