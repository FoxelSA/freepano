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

(function(root){

var $=root.jQuery;
var THREE=root.THREE;
var Panorama=root.Panorama;
var PointCloud=root.PointCloud;
var setupEventDispatcher=root.setupEventDispatcher;

function ParticleSequence(options){

  if (!(this instanceof ParticleSequence)) {
    return new ParticleSequence(options);
  }

  $.extend(true,this,this.defaults,options);

  this.init();

} // ParticleSequence

$.extend(true,ParticleSequence.prototype,{

    defaults: {

      mode: {},

      // point cloud particle index list
      particleIndex_list: [],

      // line segments
      line: {
        scene: null,
        instance: {},
        material: {
          options: {
            color: 'black',
            lineWidth: 2
          }
        },
        geometry: {
          maxPoints: 500,
          options: {}
        },
        type: THREE.LineStrip
      },

      // line segment labels
      label: {
        scene: null,
        object3D_list: []
      }
    },

    init: function particleSequence_init(){

      var seq=this;
      var line=seq.line;

      // if THREE.Line has to be instantiated
      if (!(line.instance instanceof THREE.Line)) {

        // if line geometry has to be instantiated
        if (!(line.geometry.instance instanceof THREE.Geometry)){

          // instantiate line geometry
          var geometry=line.geometry.instance=new THREE.Geometry(line.geometry.options);

          // create empty buffer vertices
          var maxPoints=line.geometry.maxPoints;
          var v=new THREE.Vector3();
          for (var i=0; i<maxPoints; ++i) {
            geometry.vertices.push(v);
          }
        }

        // instantiate line material
        if (!(line.material.instance instanceof THREE.LineBasicMaterial)) {
          line.material.instance=new THREE.LineBasicMaterial(line.material.options);
        }

        // instantiate THREE.Line
        line.instance=new THREE.Line(line.geometry.instance,line.material.instance,line.type);
        line.instance.dynamic=true;

        // instantiate line.scene
        if (!(line.scene instanceof THREE.Scene)) {
          line.scene=new THREE.Scene();
        }

        if (!(seq.label.scene instanceof THREE.Scene)) {
          seq.label.scene=new THREE.Scene();
        }

        line.scene.add(line.instance);

      }

    }, // particleSequence_init

    // add a particle
    add: function particleSequence_add(index) {

      var seq=this;
      var line=seq.line;
      var pointCloud=seq.pointCloud;
      var panorama=pointCloud.panorama;

      var prevcount=seq.particleIndex_list.length;
      if (prevcount>=line.geometry.maxPoints) {
        $.notify('Maximum number of segments reached');
        return;
      }

      // register particle index
      seq.particleIndex_list.push(index);

      // get particle world coordinates
      var vw=new THREE.Vector3().copy(pointCloud.getParticlePosition(index));

      // convert to sphere coordinates
      var vs=new THREE.Vector3().copy(vw).normalize().multiplyScalar(panorama.sphere.radius);

      // add particle to line geometry
      var geometry=line.instance.geometry;
      if (prevcount) {
        geometry.vertices.shift();
      }

      geometry.vertices[line.geometry.maxPoints-1]=vs;
      geometry.verticesNeedUpdate=true;
      geometry.computeLineDistances();

      // add new segment label ?
      if (prevcount) {

        // get particles world coordinates
        var v1=new THREE.Vector3().copy(pointCloud.getParticlePosition(seq.particleIndex_list[prevcount-1]));
        var v2=vw;

        // compute segment length, rounded to mm
        var distance=Math.round(v1.distanceTo(v2)*1000)/1000;

        // instantiate segment label text sprite
        var canvas=seq.labelText2Canvas(distance+'m');
        var texture=new THREE.Texture(canvas);
        texture.needsUpdate=true;
        var sprite=new THREE.Sprite(new THREE.SpriteMaterial({
           map: texture,
           transparent: true,
           depthTest: false,
           depthWrite: false
        }));
        sprite.scale.set(canvas.width/20,canvas.height/20,1.0);

        var object3D=new THREE.Object3D();
        object3D.add(sprite);

        // get particles sphere coordinates
        v1=geometry.vertices[line.geometry.maxPoints-2];
        v2=vs;

        // set segment label position (midpoint)
        object3D.position.set((v1.x+v2.x)/2,(v1.y+v2.y)/2,(v1.z+v2.z)/2);

        // add segment label to list
        seq.label.object3D_list.push(object3D);
        seq.label.scene.add(object3D);
      }

    }, // particleSequence_add

    labelText2Canvas: function particleSequence_labelText2Canvas(text,options){

      function roundRect(ctx, x, y, w, h, r) {
          ctx.beginPath();
          ctx.moveTo(x+r, y);
          ctx.lineTo(x+w-r, y);
          ctx.quadraticCurveTo(x+w, y, x+w, y+r);
          ctx.lineTo(x+w, y+h-r);
          ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
          ctx.lineTo(x+r, y+h);
          ctx.quadraticCurveTo(x, y+h, x, y+h-r);
          ctx.lineTo(x, y+r);
          ctx.quadraticCurveTo(x, y, x+r, y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();   
      }

      var options=$.extend(true,{
         fontSize: 48,
         padding: 16,
      }, options);

      var canvas=document.createElement('canvas');
      var ctx=canvas.getContext('2d');

      // measure text
      ctx.font=options.font||" "+options.fontSize+"px helvetica";
      ctx.align='left';
      ctx.textBaseline='middle';
      var size=ctx.measureText(text);

      // set canvas size according to text width
      canvas.width=size.width+options.padding;
      canvas.height=options.padding*2+options.fontSize;
      ctx=canvas.getContext('2d');

      // draw rect
      ctx.lineWidth=2;
      var border=ctx.lineWidth;
      ctx.fillStyle="rgba(236,177,0,0.5)";
      ctx.strokeStyle="rgba(0,0,0,0.5)";
      roundRect(ctx, border/2, border/2, canvas.width-8, canvas.height-8, 8);

      // draw text
      ctx.beginPath();
      ctx.lineWidth=1;
      ctx.font=options.font||" "+options.fontSize+"px helvetica";
      ctx.fillStyle=options.fillStyle||"rgba(0,0,0,1)";
      ctx.strokeStyle=options.strokeStyle||"rgba(0,0,0,1)";
      ctx.align='left';
      ctx.textBaseline='middle';
      ctx.fillText(text,options.padding,canvas.height/2,(canvas.width-options.padding*2));
//      ctx.strokeText(text,options.padding,canvas.height/2,(canvas.width-options.padding*2));

      return canvas;

    }, // particleSequence_labelText2Canvas

    on_pointcloud_render: function particleSequence_on_pointcloud_render(e) {
      var pointCloud=this;
      var seq=pointCloud.sequence;

      if (!seq || seq.particleIndex_list.length<2) {
        return;
      }
      var panorama=this.panorama;

      // render line segments
      panorama.renderer.clearDepth();
      panorama.renderer.render(seq.line.scene,panorama.camera.instance);

      // render segment labels
      panorama.renderer.clearDepth();
      panorama.renderer.render(seq.label.scene,panorama.camera.instance);

    }, // particleSequence_on_pointcloud_render

    on_pointcloud_particleclick: function particleSequence_on_pointcloud_particleclick(e) {
      var pointCloud=this;
      var seq=pointCloud.sequence;
      var panorama=pointCloud.panorama;

      if (!seq) {
        return;
      }

      if (!seq.mode.add) {
        return;
      }

      seq.add(e.target);

      panorama.drawScene();

    }, // particleSequence_on_panorama_click

    on_pointcloud_ready: function particleSequence_on_pointcloud_ready(e) {
      var pointCloud=this;

      pointCloud.sequence=new ParticleSequence({
        pointCloud: pointCloud
      });

    }, // particleSequence_on_pointcloud_ready

    on_pointcloud_dispose: function particleSequence_on_pointcloud_dispose(e) {
    } // particleSequence_on_pointcloud_dispose

}); // extend ParticleSequence prototype

// define PoinCloud.Sequence
PointCloud.prototype.Sequence=ParticleSequence;

// register to Panorama events
Panorama.prototype.dispatchEventsTo(ParticleSequence.prototype);

// register to PointCloud events
PointCloud.prototype.dispatchEventsTo(ParticleSequence.prototype);

// allow ParticleSequence instances to dispatch events
setupEventDispatcher(ParticleSequence.prototype);

})(window);

