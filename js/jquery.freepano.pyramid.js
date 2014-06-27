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

function Pyramid(options) {
  if (!(this instanceof Pyramid)) {
    return new Pyramid(options);
  }
  $.extend(true,this,this.defaults,options);
  this.init();
}

$.extend(true,Pyramid.prototype,{
  defaults: {
    levels: 1,
    curLevel: 0,
    dirName: null,
    baseName: null,
    zoomThreshold: {
      min: 0.5,
      max: 1
    },
    sphere: [],
    texture: []
  },
  init: function pyramid_init(){
    var pyramid=this;
    pyramid.sphereUpdate({
      callback: function(){
        pyramid.panorama.sphere=this;
        pyramid.callback();
        setTimeout(function(){ // TODO set first level according to fov canvas width and texture width
          pyramid.panorama.zoomUpdate();
        },0);
      }
    });
    if (pyramid.preload) {
      for(var level=0; level<pyramid.levels; ++level) {
        if (!(pyramid.sphere[level] instanceof Sphere)) {
          pyramid.initSphere(level,pyramid.sphere[level]);
        }
      }
    }
  },
  initTexture: function pyramid_initTexture(level,textureOptions) {
    var pyramid=this;
    pyramid.texture[level]=new Texture($.extend(true,{
      dirName: pyramid.dirName+'/'+level,
      baseName: pyramid.baseName,
      rows: Math.pow(2,level),
      columns: Math.pow(2,level+1),
    },textureOptions));
  },
  initSphere: function pyramid_initSphere(level,sphereOptions) {
    var pyramid=this;
    if (!(pyramid.texture[level] instanceof Texture)) {
      pyramid.initTexture(level,pyramid.texture[level]);
    }
    pyramid.sphere[level]=new Sphere($.extend(true,{
      texture: pyramid.texture[level]
    },sphereOptions));
  },
  sphereUpdate: function pyramid_sphereUpdate(sphereOptions) {
    var pyramid=this;
    console.log('level '+pyramid.curLevel);
    var panorama=pyramid.panorama;
    if (!(pyramid.sphere[pyramid.curLevel] instanceof Sphere)) {
      pyramid.initSphere(pyramid.curLevel,$.extend(true,{},{
        //loading: true,
        callback: function() {
          if (panorama.scene) {
            panorama.scene.remove(panorama.sphere.object3D);
            panorama.sphere=this;
            panorama.scene.add(panorama.sphere.object3D);
         //   pyramid.loading=false;
              panorama.zoomUpdate();
          } else {
            panorama.sphere=this;
          }
        }
      },pyramid.sphere[pyramid.curLevel]||{},sphereOptions));
    } else {
      panorama.scene.remove(panorama.sphere.object3D);
      panorama.sphere=pyramid.sphere[pyramid.curLevel];
      panorama.scene.add(panorama.sphere.object3D);
      panorama.drawScene();
    }
  },
  pyramid_panoramaZoomUpdate: function pyramid_panoramaZoomUpdate(panorama) {
    var pyramid=this;
    if (1/panorama.camera.zoom.current>pyramid.zoomThreshold.max) {
      if (pyramid.curLevel+1<pyramid.levels) {
        ++pyramid.curLevel;
        panorama.camera.zoom.current*=2;
        pyramid.sphereUpdate();
        return false;
      }
    } else if (1/panorama.camera.zoom.current<pyramid.zoomThreshold.min) {
      if (pyramid.curLevel>0) {
        --pyramid.curLevel;
        panorama.camera.zoom.current/=2;
        pyramid.sphereUpdate();
        return false;
      }
    }
    return true;
  }
});

$.extend(Pyramid.prototype,{
    panorama_init: Panorama.prototype.init,
    panorama_zoomUpdate: Panorama.prototype.zoomUpdate,
    panorama_setRotationMatrix: Panorama.prototype.setRotationMatrix
});

$.extend(Panorama.prototype,{
  init: function panorama_init() {
    var panorama=this;
    if (panorama.pyramid!==undefined) {
      if (!(panorama.pyramid instanceof Pyramid)) {
        panorama.pyramid=new Pyramid($.extend(true,{
          panorama: panorama,
          callback: function() {
            Pyramid.prototype.panorama_init.call(panorama);
          }
        },panorama.pyramid));
      }
    } else {
      Pyramid.prototype.panorama_init.call(panorama);
    }
  },
  zoomUpdate: function panorama_zoomUpdate() {
    var panorama=this;
    if (!panorama.pyramid || (/*!panorama.pyramid.loading && */Pyramid.prototype.pyramid_panoramaZoomUpdate.apply(panorama.pyramid,[panorama]))) {
      Pyramid.prototype.panorama_zoomUpdate.call(panorama);
    }
  },
  setRotationMatrix: function panorama_setRotationMatrix(R) {
    var panorama=this;
    var pyramid=panorama.pyramid;
    if (!pyramid){
     Pyramid.prototype.panorama_setRotationMatrix.apply(panorama,[R]);
     return;
    }
    $.each(pyramid.sphere,function(){
      if (this instanceof Sphere) {
        this.setRotationMatrix(R);
      }
    });
  }
});

