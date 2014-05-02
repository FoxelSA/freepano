/*                                                                                                                                                                                                                   
 *  jquery.freepano.js
 *
 *  Copyright (C) 2014 Foxel www.foxel.ch
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *  Created on: Mar 27, 2014
 *      Author: luc.deschenaux@foxel.ch
 */


function Texture(options) {
  if (!(this instanceof Texture)) {
    return new Texture(options);
  }
  $.extend(true,this,this.defaults,options);
  this.init();
}

$.extend(true,Texture.prototype,{
  defaults: {
    src: null,
    options: {
      wrapS: THREE.clampToEdgeWrapping,
      wrapT: THREE.clampToEdgeWrapping,
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearFilter
    },
    levels: 1,
    current: 0,
    baseName: null,
    columns: function(){
      return this.rows()*2;
    },
    rows: function texture_rows(){
      return Math.pow(2,this.current);
    },
    getTile: function(col,row) {
      return this.src+this.current+'/'+this.baseName+'_'+row+'_'+col+'.jpg';
    }
  },
  init: function texture_init(){
  }
});

function Sphere(options) {
  if (!(this instanceof Sphere)) {
    return new Sphere(options);
  }
  $.extend(true,this,this.defaults,options);
  this.init();
}

$.extend(true,Sphere.prototype,{
  defaults: {
    radius: 15,
    widthSegments: 60,
    heightSegments: 30,
    texture: null,
    object3D: [],
    callback: function(){}
  },

  init: function sphere_init(callback) {
    if (!(this.texture instanceof Texture)) {
      this.texture=new Texture(this.texture);
    }
    this.done=false;
    this.object3D[this.texture.current]=new THREE.Object3D();
    this.build(callback);
  },

  build: function sphere_build(callback) {
    var self=this;
    var columns=this.texture.columns();
    var rows=this.texture.rows();
    var phiLength=2*Math.PI/columns;
    var thetaLength=Math.PI/rows;
    var remaining=columns*rows;
    var transform=new THREE.Matrix4().makeScale(-1,1,1);
    for(var col=0; col<columns; ++col) {
      for(var row=0; row<rows; ++row) {
        var geometry=new THREE.SphereGeometry(this.radius,this.widthSegments,this.heightSegments,col*phiLength,phiLength,row*thetaLength,thetaLength);
        geometry.applyMatrix(transform);

        var tileTexture=THREE.ImageUtils.loadTexture(this.texture.getTile(col,row),new THREE.UVMapping(),function(){
          --remaining;                                                          
          if (!remaining) {                                                     
            setTimeout(function(){
              self.texture.height=rows*texture.image.height;
              self.done=true;
              if (callback) {
                callback.call(self);
              } else {
                self.callback()
              }
            },0);                                                    
          }                                                                     
        },                                                                      
        function(){                                                             
          $.notify('Cannot load panorama.');                             
        });                                                                     
        $.extend(tileTexture,this.texture.options);

        var material=new THREE.MeshBasicMaterial({
            map: tileTexture
        });
        mesh=new THREE.Mesh(geometry,material);
        this.object3D[this.texture.current].add(mesh);
      }
    }
  } 
});

var pano_count=0;
function Panorama(options) {
  if (!(this instanceof Panorama)) {
    return new Panorama(options);
  }
  $.extend(true,this,this.defaults,options);
  this.num=pano_count++;
  this.init();
  $(this.container).data('pano',this);
}

$.extend(true,Panorama.prototype,{
    defaults: {
      mode: {},
      container: 'body',
      fov: {
        start: 60,
        min: 10,
        max: 60
      },
      nearPlane: 0.1,
      farPlane: 1100,
      sphere: null,
      lon: 0,
      lat: 0,
      phi: 0,
      theta: 0,
      callback: function(){}
    },

    init: function init(){
      var self=this;
      this.scene=new THREE.Scene();

      if (!(this.sphere instanceof Sphere)) {
        this.sphere=new Sphere($.extend(true,{
          callback: function(){
            self.resize();
            self.callback();
          }
        },this.sphere));
      }

      this.scene.add(this.sphere.object3D[this.sphere.texture.current]);
      this.projector=new THREE.Projector();

      this.camera=new THREE.PerspectiveCamera(this.fov.start, $(this.container).width() / $(this.container).height(), this.nearPlane, this.farPlane);
      this.camera.target=new THREE.Vector3(0,0,0);
      this.camera.zoom={
        max:  1,
        min:  0.25,
        current: 1
      };
      this.camera.fovYMax=70;
      this.camera.fovYMin=10;

      if (!(this.renderer instanceof THREE.WebGLRenderer)) {
        try {
          this.renderer=new THREE.WebGLRenderer(this.renderer);
          this.renderer.renderPluginsPre=[];
          this.renderer.renderPluginsPost=[];

        } catch(e) {
          $.notify('Cannot initialize WebGL');
          console.log(e);
          return;
        }
      }

      this.renderer.setSize($(this.container).width(),$(this.container).height());
      $(this.container).append(this.renderer.domElement);

      if (this.postProcessing) {
        // renderer pass
        this.composer=new THREE.EffectComposer(this.renderer);
        this.composer.addPass(new THREE.RenderPass(this.scene,this.camera));
        // shader passes
        $.each(this.postProcessing,function() {
          if (this instanceof Boolean) {
            return true;
          }
          this.pass=new THREE.ShaderPass(this.shader);
          this.pass.enabled=this.enabled;
          var pass=this.pass;
          $.each(this.uniforms,function(uniform,set){
            set.call(pass.uniforms[uniform],self);
          });
          self.composer.addPass(this.pass);
        });

        // to avoid CopyShader below you may want to
        // set renderToScreen to true for the last enabled shader
        if (this.postProcessing.renderToScreen!==false) {
          var effect=new THREE.ShaderPass(THREE.CopyShader);
          effect.renderToScreen=true;
          this.composer.addPass(effect);
        } 
      }
      this.eventsInit();
    },

    eventsInit: function panorama_eventsInit(){
      var self=this;
      var canvas=$('canvas:first',this.container);
      $(this.container)
      .off('.panorama'+this.num)
      .on('mousedown.panorama'+this.num, canvas, function(e){self.mousedown(e);})
      .on('mousemove.panorama'+this.num, canvas, function(e){self.mousemove(e)})
      .on('mouseup.panorama'+this.num, canvas, function(e){self.mouseup(e)})
      .on('mousewheel.panorama'+this.num, canvas, function(e){self.mousewheel(e)});
      $(window).on('resize.panorama'+this.num, function(e){self.resize(e)});
    },

    mousedown: function panorama_mousedown(e){
      this.mode.mousedown=true;
      if (isLeftButtonDown(e)) {
        this.mousedownPos={
          x: e.clientX,
          y: e.clientY,
          lon: this.lon,
          lat: this.lat
        };
      }
    },
    
    mousemove: function panorama_mousemove(e){
      if (!this.sphere.done) {
        return;
      }
      if (this.mode.mousedown) {
        if (isLeftButtonDown(e)) {
          this.lon=(this.mousedownPos.x-e.clientX)*0.1+this.mousedownPos.lon;
          this.lat=(e.clientY-this.mousedownPos.y)*0.1+this.mousedownPos.lat;
          this.drawScene();
        }
      }
    },
    
    mouseup: function panorama_mouseup(e){
      this.mode.mousedown=false;
    },
   
    zoomUpdate: function panorama_zoomUpdate() {
      if (this.camera.zoom.current>1) {
        if (this.sphere.texture.current+1<this.sphere.texture.levels) {
          this.scene.remove(this.sphere.object3D[this.sphere.texture.current]);
          ++this.sphere.texture.current;
          this.camera.zoom.current/=2;
          this.sphere.texture.height*=2;
          if (this.sphere.object3D[this.sphere.texture.current]) {
            this.scene.add(this.sphere.object3D[this.sphere.texture.current]);
            this.drawScene();
          } else {
            var self=this;
            this.sphere.init(function(){
              self.scene.add(this.object3D[this.texture.current]);
              setTimeout(function(){self.zoomUpdate()},0);
            });
          }
          return;
        }
      } else if (this.camera.zoom.current<0.5) {
        if (this.sphere.texture.current>1) {
          this.scene.remove(this.sphere.object3D[this.sphere.texture.current]);
          --this.sphere.texture.current;
          this.camera.zoom.current*=2;
          this.sphere.texture.height/=2;
          if (this.sphere.object3D[this.sphere.texture.current]) {
            this.scene.add(this.sphere.object3D[this.sphere.texture.current]);
            this.drawScene();
          } else {
            var self=this;
            this.sphere.init(function(){
              self.scene.add(this.object3D[this.texture.current]);
              setTimeout(function(){self.zoomUpdate()},0);
            });
          }
          return;
        }
      }
      console.log(this.camera.zoom.current);
      var fov=this.camera.fov;
      var width=this.renderer.domElement.width;
      var height=this.renderer.domElement.height;
      this.camera.zoom.current=Math.min(this.camera.zoom.max,Math.max(this.camera.zoom.min,this.camera.zoom.current));
      this.camera.fov=180*height/this.sphere.texture.height/this.camera.zoom.current;
      this.camera.fov=Math.min(this.camera.fovYMax,Math.max(this.camera.fovYMin,this.camera.fov));
      this.camera.zoom.current=Math.round(1000*180*height/this.sphere.texture.height/this.camera.fov)/1000;
      console.log(fov);
      
   /*   if (true || this.keepZoom) {
        this.camera.fovYMin=180*height/this.sphere.texture.height/this.camera.zoom.max;
        if ((this.camera.fov < this.camera.fovYMin) || (this.camera.fov > this.camera.fovYMax)) {
          if (this.camera.fov < this.camera.fovYMin) this.camera.fov=this.camera.fovYMin;
          if (this.camera.fov > this.camera.fovYMax) this.camera.fov=this.camera.fovYMax;
        }
      } else {
        this.camera.fovYMin=180*height/this.sphere.texture.height/this.camera.zoom.max;
        if (this.camera.fov < this.camera.fovYMin) this.camera.fov=this.camera.fovYMin;
      }
*/
      if (fov!=this.camera.fov) {
        this.camera.updateProjectionMatrix();
        this.drawScene();
      }
    },
 
    mousewheel: function panorama_mousewheel(e){
      if (!this.sphere.done) {
        return;
      }
      this.camera.zoom.current += e.deltaY * 0.01;
      this.zoomUpdate();
    },

    drawScene: function panorama_drawScene(){
      if (!this.sphere.done) {
        return;
      }
      var self=this;
      requestAnimationFrame(function(){self.render()});
    },

    render: function render() {
      if (!this.sphere.done) {
        return;
      }
      this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
      this.phi = THREE.Math.degToRad( 90 - this.lat );
      this.theta = THREE.Math.degToRad( this.lon );

      this.camera.target.x = this.sphere.radius * Math.sin( this.phi ) * Math.cos( this.theta );
      this.camera.target.y = this.sphere.radius * Math.cos( this.phi );
      this.camera.target.z = this.sphere.radius * Math.sin( this.phi ) * Math.sin( this.theta );
      this.camera.lookAt( this.camera.target );

      if (this.postProcessing && this.postProcessing.enabled) {
        this.composer.render(this.scene,this.camera);
      } else {
        this.renderer.render(this.scene,this.camera);
      }
    },

    resize: function panorama_resize(e){
      var self=this;
      this.camera.aspect = $(this.container).width()/$(this.container).height();
      this.camera.updateProjectionMatrix();
      this.renderer.setSize($(this.container).width(),$(this.container).height());
      if (this.postProcessing) {
        this.composer.setSize($(this.container).width(),$(this.container).height());
        $.each(this.postProcessing,function() {
          var pass=this.pass;
          if (pass) {
            $.each(this.uniforms,function(uniform,set){
              set.call(pass.uniforms[uniform],self);
            });
          }
        });
      }
      setTimeout(function(){
        if (!self.sphere.done) {
          return;
        }
        self.zoomUpdate();
        self.drawScene();
      },0);
    }
});

function isLeftButtonDown(e) {
  return ((e.buttons!==undefined && e.buttons==1) || (e.buttons===undefined && e.which==1));
}

$.fn.panorama=function(options){
  $(this).each(function(){
    if ($(this).data('pano')) {
    } else {
      var panorama=new Panorama($.extend(true,{},options,{
        container: this
      }));
    }
  });
  return this;
}
