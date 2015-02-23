/*
 * freepano - WebGL panorama viewer
 *
 * Copyright (c) 2015 FOXEL SA - http://foxel.ch
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

function PointCloud(options) {
  if (!(this instanceof PointCloud)) {
    return new PointCloud(options);
  }
  $.extend(true,this,{},this.defaults,options);
  this.init();
}

$.extend(true,PointCloud.prototype,{

  defaults: {

    overlay: true,

    // paramaeters for converting panorama url to pointcloud json url
    urlReplace: {
      replaceThis: new RegExp(/\/pyramid\/.*/),
      replaceWithThis: '/pointcloud/',
      suffix: '-freepano.json'
    },

    // point cloud dot material
    dotMaterial: new THREE.PointCloudMaterial({
        map: THREE.ImageUtils.loadTexture('img/dot.png'),
        size: 0.15,
        color: 'yellow',
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8,
        alphaTest: 0.1,
        depthTest: false,
        depthWrite: false
    }), // pointCloud.defaults.dotMaterial
   
   // generate particle positions array from json 
    parseJSON: function parseJSON(json) {

      var pointCloud=this;
      var panorama=pointCloud.panorama;

      var positions = new Float32Array(json.points.length * 3);

      var v=new THREE.Vector3();
      var Xaxis=new THREE.Vector3(1,0,0);
      var Yaxis=new THREE.Vector3(0,1,0);

      console.log('parsing cloud... ('+json.points.length+' points)');
      var i=0;

      // for each point defined in the json
      json.points.forEach(function(point,index) {
        // initialize vector at z = sphere radius
        v.x=0;
        v.y=0;
        v.z=1;

        // apply rotations
        v.applyAxisAngle(Xaxis,point[1]);
        v.applyAxisAngle(Yaxis,point[0]);

        // store position
        positions[i]=-v.x*point[2];
        positions[i+1]=v.y*point[2];
        positions[i+2]=v.z*point[2];
        i+=3;

      });
      console.log('parsing cloud... done');

      return positions;

    }, // pointCloud.defaults.parseJSON

    // sort point cloud particles by depth
    sortParticles: true,

    // raycaster options
    raycaster: {
      threshold: 0.5 
    }

  }, // pointCloud.prototype.defaults

  init: function pointCloud_init(){
    var pointCloud=this;

    if (pointCloud.overlay) {
      pointCloud.scene=new THREE.Scene();
    }

    // init raycaster
    if (!(pointCloud.raycaster instanceof THREE.Raycaster)) {
      if (pointCloud.raycaster && pointCloud.raycaster.instance) {
        delete pointCloud.raycaster.instance;
      }
      pointCloud.raycaster.instance=new THREE.Raycaster(pointCloud.raycaster.options);
      pointCloud.raycaster.instance.params.PointCloud.threshold=pointCloud.raycaster.threshold||0.01;
    }

    // load url if any
    if (pointCloud.url) {
      pointCloud.fromURL(pointCloud.url);

    // load json if any
    } else if (pointCloud.json) {
      pointCloud.fromJSON(pointCloud.json);
    }

  }, // pointCloud_init

  // load point cloud json from url
  fromURL: function pointCloud_fromURL(url) {

    var pointCloud=this;
    pointCloud.url=url;

    $.ajax({

      url: pointCloud.url,

      error: function() {
        // trigger pointcloud 'loaderror' event
        pointCloud.dispatch('loaderror',Array.prototype.slice.call(arguments));
      }, // error

      success: function(json){

        // no data available ?
        if (!json.points) {
          // trigger pointcloud 'loaderror' event
          pointCloud.dispatch('loaderror',Array.prototype.slice.call(arguments));
          return;
        }

        // parse point cloud json
        pointCloud.fromJSON(json);

        // trigger pointcloud 'load' event
        pointCloud.dispatch('load');

      } // success

    });  // ajax
    
  }, // pointCloud_fromURL

  // load point cloud from json
  fromJSON: function pointCloud_fromJSON(json){

    var pointCloud=this;

    // keep json reference
    pointCloud.json=json;

    // instantiate point cloud geometry
    pointCloud.geometry=new THREE.BufferGeometry();
    
    // extract particles positions from JSON 
    var positions=pointCloud.parseJSON(json);

    // add particles to geometry
    pointCloud.geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3)); 
    
    // instantiate object3D 
    pointCloud.object3D=new THREE.PointCloud(pointCloud.geometry,pointCloud.dotMaterial);
    pointCloud.object3D.sortParticles=pointCloud.sortParticles;

  }, // pointCloud_fromJSON

  // pointcloud 'load' event handler
  onload: function pointCloud_onload(e) {

    var pointCloud=this;
    var panorama=pointCloud.panorama;

    // add pointcloud to scene
    var scene=(pointCloud.overlay)?pointCloud.scene:panorama.scene;
    scene.add(pointCloud.object3D);

    panorama.drawScene();
  
  }, // pointCloud_onload

  // pointcloud 'loaderror' event handler
  onloaderror: function pointCloud_onloaderror(e) {
    throw e;
  }, // onloaderror

  // render pointcloud overlay on "panorama render" event
  on_panorama_render: function pointCloud_on_panorama_render(){

    var panorama=this;
    if (!panorama.pointCloud) {
      return;
    }

    var pointCloud=panorama.pointCloud.instance;
    if (!pointCloud) {
      return;
    }

    var cursor=pointCloud.cursor;
    if (cursor) {
      var scale=0.1/p.getZoom();
      cursor.sprite.scale.set(scale,scale,scale);
    }

    if (pointCloud.overlay) {
      panorama.renderer.clearDepth();
      panorama.renderer.render(pointCloud.scene,panorama.camera.instance);  
    }

    pointCloud.dispatch('render');

  }, // on_panorama_render

  // trigger pointcloud 'particlemouseover' event on particle mouseover
  on_panorama_mousemove: function pointCloud_on_panorama_mousemove(e){

    var panorama=this;
    var pointCloud=panorama.pointCloud;

    if (
      !pointCloud ||
      !pointCloud.instance ||
      pointCloud.active===false ||
      !pointCloud.instance.object3D ||
      !pointCloud.instance.object3D.visible
    ) {
      return;
    }

    // compute mouse normalized coordinates
    var canvas=panorama.renderer.domElement;
    var offset=$(canvas).offset();
    var mouse={
      x: ((e.clientX-offset.left) / canvas.width) * 2 - 1,
      y: -((e.clientY-offset.top) / canvas.height) * 2 + 1
    }

    // setup raycaster
    var raycaster=pointCloud.instance.raycaster;
    raycaster.instance.setFromCamera(mouse,panorama.camera.instance);

    // get intersection list
    var intersections=raycaster.instance.intersectObject(pointCloud.instance.object3D);

    // trigger pointcloud mouseover event
    if (intersections.length) {
      pointCloud.instance.dispatch({
          type: 'particlemouseover',
          target: intersections,
          originalEvent: e
      });
    } else {
      if (pointCloud.hover){
        pointCloud.instance.dispatch({
            type: 'particlemouseout',
            target: pointCloud.hover.index
        });
      }
    }

  }, // pointCloud_on_panorama_render

  // snap to nearest intersecting particle
  onparticlemouseover: function on_pointcloud_particlemouseover(e){

    var pointCloud=this;
    var panorama=pointCloud.panorama;

    var particle_list=e.target;

    // get nearest point index
    panorama.getMouseCoords(e.originalEvent);
    var hover=pointCloud.nearestParticle(panorama.mouseCoords,particle_list);

    // if we were already hovering
    if (pointCloud.hover) {
      // and it was another point
      if (hover.index != pointCloud.hover.index){
        // then trigger 'particlemouseout'
        var e={
            type: 'particlemouseout',
            target: pointCloud.hover.index
        }
        // unless event handler doesnt agree to remove hover attribute
        if (pointCloud.dispatch(e)===false) {
          return false;
        }
      } else {
        // already hovering the same point, return
        return 
      }
    }

    // mousein
    pointCloud.hover=hover;

    var material;
    var cursor=pointCloud.cursor;

    // instantiate cursor if needed
    if (!cursor) {
      cursor=pointCloud.cursor={
        material: new THREE.SpriteMaterial({
          map: THREE.ImageUtils.loadTexture('img/dot_hover.png'),
          depthTest: false,
          depthWrite: false

        }),
        geometry: new THREE.Geometry()
      }
      cursor.sprite=new THREE.Sprite(cursor.material);
      pointCloud.scene.add(cursor.sprite);
    }

    cursor.sprite.position.copy(new THREE.Vector3().copy(pointCloud.getParticlePosition(hover.index)).normalize().multiplyScalar(10));

    pointCloud.panorama.drawScene();

    pointCloud.dispatch({
        type: 'particlemousein',
        target: hover.index
    });

  }, // pointCloud_particleonmouseover

  onparticlemousein: function pointCloud_onparticlemousein(e) {
    var pointCloud=this;
    pointCloud.showParticleInfo(pointCloud.hover.index);
  }, // pointCloud_onparticlemousein

  onparticlemouseout: function pointCloud_onparticlemouseout(e) {
    var pointCloud=this;
    pointCloud.hideParticleInfo();
  }, // pointCloud_onparticlemousein

  // return particle with least square distance from coords in radians
  nearestParticle: function pointCloud_nearestParticle(coords,particle_list) {
    var pointCloud=this;
    var panorama=pointCloud.panorama;
    var candidate=0;
    var d2min=999;
    var point_list=pointCloud.json.points;

    $.each(particle_list,function(i){

      var point=point_list[this.index];

      // compute absolute angle difference
      var dthe=Math.abs(point[0]-panorama.mouseCoords.theta);
      var dphi=Math.abs(point[1]+panorama.mouseCoords.phi);

      // adjust delta when crossing boundaries
      // (assume distance is less than half image)
      if (dthe>Math.PI) dthe=Math.PI*2-dthe;
      if (dphi>Math.PI/2) dphi=Math.PI-dphi;

      // select least square distance
      var dsquare=dthe*dthe+dphi*dphi;
      if (dsquare<d2min) {
        d2min=dsquare;
        candidate=i;

      // select nearest point on z axis when equidistant from cursor
      } else if (dsquare==d2min) {
        if (point_list[candidate].point[2]>point[2]) {
          candidate=i;
        }
      }

    });

    return particle_list[candidate];

  }, // pointCloud_nearestParticle

  // return particle world coordinates
  getParticlePosition: function pointCloud_getParticlePosition(index) {
    var pointCloud=this;
    var point=pointCloud.json.points[index];

    // initialize vector
    var v=new THREE.Vector3(0,0,1);

    // apply rotations
    v.applyAxisAngle(Xaxis,point[1]);
    v.applyAxisAngle(Yaxis,point[0]);

    // return positions
    return {
      x: -v.x*point[2],
      y: v.y*point[2],
      z: v.z*point[2]
    }
  }, // pointCloud_getParticlePosition

  showParticleInfo: function pointCloud_showParticleInfo(index) {
    var pointCloud=this;
    var point=pointCloud.json.points[index];
    var panorama=pointCloud.panorama;

    var div = $('#particleInfo');
    if (!div.length) {
        div = $('<div id="particleInfo">').appendTo(panorama.container).css({
            position: 'absolute',
            top: 0,
            left: 0,
            width: 128,
            backgroundColor: "rgba(0,0,0,.4)",
            color: 'white'
        });
    }

    var html = '<div style="width: 100%; position: relative; margin-left: 10px;">';
    html += '<strong>Particle info</strong><br />';
    html += 'theta: ' + point[0].toPrecision(6) + '<br />';
    html += 'phi: ' + point[1].toPrecision(6) + '<br />';
    html += 'distance: ' + point[2].toPrecision(6) + '<br />';
    html += 'index: ' + point[3] + '<br />';
    div.html(html);

  }, // pointCloud_showParticleInfo

  hideParticleInfo: function pointCloud_hideParticleInfo(){
    $('#particleInfo').hide(0);
  }, // pointCloud_hideParticleInfo

  // instantiate point cloud on panorama_ready
  on_panorama_ready: function pointCloud_on_panorama_ready(e) {

    var panorama=this;

    if (panorama.pointCloud && panorama.pointCloud.active!==false) {

      // get panorama url to pointcloud url conversion details
      var urlReplace=panorama.pointCloud.urlReplace||PointCloud.prototype.defaults.urlReplace;
      var replaceThis=urlReplace.replaceThis;
      var replaceWithThis=urlReplace.replaceWithThis;
      var suffix=urlReplace.suffix;

      // instantiate pointcloud
      var pointCloud=panorama.pointCloud.instance=new PointCloud($.extend(true,{},panorama.pointCloud,{
        panorama: panorama,
        url: panorama.sphere.texture.dirName.replace(replaceThis,replaceWithThis)+p.list.currentImage+suffix
      }));
    }

  }, // pointCloud_on_panorama_ready

  // dispose pointcloud on panorama dispose
  on_panorama_dispose: function pointCloud_on_panorama_dispose(e) {
    var panorama=this;
    if (panorama.pointCloud && panorama.pointCloud.instance) {
      var scene=(panorama.pointCloud.instance.overlay)?panorama.pointCloud.instance.scene:panorama.scene;
      scene.remove(panorama.pointCloud.instance.object3D);
      delete panorama.pointCloud.instance;
    }
  } // pointCloud_on_panorama_dispose

});

setupEventDispatcher(PointCloud.prototype);

// subscribe to panorama events
Panorama.prototype.dispatchEventsTo(PointCloud.prototype);
