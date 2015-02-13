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
 * Contributor(s):
 *
 *      Alexandre Kraft <a.kraft@foxel.ch>
 *      Kevin Velickovic <k.velickovic@foxel.ch>
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


// Texture constructor

function Texture(options) {

  if (!(this instanceof Texture)) {
    return new Texture(options);
  }

  $.extend(true,this,this.defaults,options);
  this.init();

} // Texture

$.extend(true,Texture.prototype,{

  defaults: {
    dirName: null,
    baseName: null,
    options: {
      wrapS: THREE.clampToEdgeWrapping,
      wrapT: THREE.clampToEdgeWrapping,
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearFilter
    },
    columns: 2,
    rows: 1,
  }, // Texture defaults

  init: function texture_init(){
  },

  getTileName: function texture_getTileName(col,row) {
    return this.dirName+'/'+this.baseName+'_'+row+'_'+col+'.jpg';
  }

}); // extend Texture.prototype


// Sphere constructor
 
function Sphere(options) {
  if (!(this instanceof Sphere)) {
    return new Sphere(options);
  }
  $.extend(true,this,this.defaults,options);
  this.init();
}

$.extend(true,Sphere.prototype,{

  defaults: {
    done: false,
    radius: 15,
    widthSegments: 36,
    heightSegments: 18,
    texture: null,
    object3D: null,
    callback: function(){}

  }, // sphere defaults

  init: function sphere_init(callback) {

    var sphere=this;
    if (sphere.texture!==undefined) {
      if (!(sphere.texture instanceof Texture)) {
        sphere.texture=new Texture(sphere.texture);
        sphere.done=false;
      }
    }
    sphere.object3D=new THREE.Object3D();
    sphere.build(callback);

  }, // sphere_init

  build: function sphere_build(callback) {

    var sphere=this;

    // panorama tiles number
    var columns=sphere.texture.columns;
    var rows=sphere.texture.rows;

    // sphere segments angular size
    var phiLength=2*Math.PI/columns;
    var thetaLength=Math.PI/rows;

    // tiles to go 
    sphere.tilesToLoad=columns*rows;

    var transform=new THREE.Matrix4().makeScale(-1,1,1);

    // build sphere
    for(var col=0; col<columns; ++col) {
      for(var row=0; row<rows; ++row) {
        var geometry=new THREE.SphereGeometry(sphere.radius,sphere.widthSegments,sphere.heightSegments,col*phiLength,phiLength,row*thetaLength,thetaLength);
        geometry.applyMatrix(transform);

        var tileTexture=sphere.loadTile(col,row,callback);
        var material=new THREE.MeshBasicMaterial({
           map: tileTexture,
           depthTest: false,
           depthWrite: false
//           wireframe: true,
//           color: 'white'
        });
        mesh=new THREE.Mesh(geometry,material);
        sphere.object3D.add(mesh);
      }
    }
  }, // sphere_build

  loadTile: function sphere_loadTile(col,row,callback) {

    var sphere=this;

    var tileTexture=THREE.ImageUtils.loadTexture(
      sphere.texture.getTileName(col,row),
      THREE.UVMapping,
      function loadTexture_onload(texture){
        sphere.texture_onload(texture,callback);
      },
      function loadTexture_onerror(){
        $.notify('Cannot load panorama.');
      }
    );

    $.extend(tileTexture,sphere.texture.options,{
      col: col,
      row: row
    });

    return tileTexture;
    
  },

  texture_onload: function sphere_loadTextureOnload(texture,callback){
    var sphere=this;

    // redraw panorama after a texture is loaded
    setTimeout(function(){
      sphere.panorama.drawScene.call(sphere.panorama);
    },0);

    // check for remaining textures to load
    --sphere.tilesToLoad;
    if (!sphere.tilesToLoad) {

      // panorama loaded
      setTimeout(function(){

        // set texture height and sphere radius
        sphere.texture.height=sphere.texture.rows*texture.image.height;
        sphere.r=sphere.texture.height/Math.PI;

        sphere.done=true;
       
        // run callback passed to sphere_build if specified, else default sphere callback
        if (callback) {
          callback.call(sphere);
        } else {
          sphere.callback()
        }

      },0);
    }
  }, // sphere_texture_onload

  setTexture: function sphere_setTexture(texture_options,callback) {
    var sphere=this;
    $.extend(true,sphere.texture,texture_options);
    sphere.updateTexture(callback);
  }, // sphere_setTexture

  updateTexture: function sphere_updateTexture(callback) {
    var sphere=this;

    var columns=sphere.texture.columns;
    var rows=sphere.texture.rows;
    sphere.tilesToLoad=columns*rows;

    $.each(sphere.object3D.children,function(){

      var mesh=this;

      var row=mesh.material.map.row;
      var col=mesh.material.map.col;

      var tileTexture=sphere.loadTile(col,row,callback);

      mesh.material.map=tileTexture;
      mesh.material.needsUpdate=true;

    });
  }, // sphere_updateTexture

  isTileVisible: function sphere_isTileVisible(col,row) {
    var sphere=this;
    var panorama=sphere.panorama;
    return panorama.camera.frustum.intersectsSphere(mesh.geometry.boundingSphere);
  }

}); // extend Sphere prototype

// Camera constructor
function Camera(options) {
  if (!(this instanceof Camera)){
    return new Camera(options);
  }
  $.extend(true,this,this.defaults,options);
  this.init();
}

$.extend(true,Camera.prototype,{

    defaults: {
      fov: 120,
      nearPlane: 0.1,
      farPlane: Sphere.prototype.defaults.radius+1,
      zoom: {
        max: 1.5,
        min: 0.5,
        step: 0.05,
        current: 1
      },
      frustum: new THREE.Frustum(),
      viewProjectionMatrix: new THREE.Matrix4()
    }, // Camera defaults

    init: function camera_init() {

      var camera=this;

      camera.instance=new THREE.PerspectiveCamera(
        camera.fov,
        $(camera.panorama.container).width()/$(camera.panorama.container).height(),
        camera.nearPlane,
        camera.farPlane
      );

      camera.target=new THREE.Vector3(0,0,0);

    }, // camera_init

    updateFrustum: function camera_updateFrustum() {
      var camera=this;
//      camera.instance.updateMatrixWorld(); // make sure the camera matrix is updated
//      camera.instance.matrixWorldInverse.getInverse(camera.instance.matrixWorld);
      camera.viewProjectionMatrix.multiplyMatrices(camera.instance.projectionMatrix, camera.instance.matrixWorldInverse);
      camera.frustum.setFromMatrix(camera.viewProjectionMatrix);
    },

    on_panorama_resize: function camera_on_panorama_resize(e) {
      this.camera.updateFrustum();
    },
      
    on_panorama_zoom: function camera_on_panorama_zoom(e) {
      this.camera.updateFrustum();
    }

}); // extend Camera.prototype

// Panorama constructor
function Panorama(options) {

  if (!(this instanceof Panorama)) {
    return new Panorama(options);
  }

  $.extend(true,this,this.defaults,options);

  this.init();

} // Panorama constructor

$.extend(true,Panorama.prototype,{
    defaults: {
      mode: {},
      container: 'body',
      fov: {
        start: 120,
        min: 1,
        max: 120
      },
      camera: undefined,
      sphere: undefined,
      postProcessing: undefined,
      renderer: {
        options: {
          precision: 'lowp',
          antialias: false,
          alpha: false
        },
        properties: {
          autoClear: false,
          renderPluginsPre: [],
          renderPluginsPost: []
        }
      },
      lon: 0,
      lat: 0,
      phi: 0,
      theta: 0,
      rotation: {
        heading: 0,
        tilt: 0,
        roll: 0,
        step: 0.1
      },
      limits: {
        lat: {
            min: -85,
            max: 85
        }
      }
    }, // panorama defaults

    init: function panorama_init(){
      var panorama=this;
      $(panorama.container).data('pano',panorama);

      panorama.scene=new THREE.Scene();

      // instantiate camera
      if (!(panorama.camera instanceof Camera)) {
        panorama.camera=new Camera($.extend(true,{
          panorama: panorama,
          fov: panorama.fov.start
        },panorama.camera));
      }

      // instantiate sphere
      if (panorama.sphere!==undefined) {
        if (!(panorama.sphere instanceof Sphere)) {
          panorama.sphere=new Sphere($.extend(true,{
            panorama: panorama,
            callback: function(){
              panorama.callback('resize');
              panorama.callback('ready');
            }
          },panorama.sphere));
        }
        panorama.scene.add(panorama.sphere.object3D);
      }

      panorama.updateRotationMatrix();

      // instantiate renderer
      if (!(panorama.renderer instanceof THREE.WebGLRenderer)) {
        // try webgl renderer
        try {
          panorama.renderer=$.extend(new THREE.WebGLRenderer(panorama.renderer.parameters),panorama.renderer.properties);
          panorama.renderer.setPixelRatio(window.devicePixelRatio);
        } catch(e) {
          // fallback to 2D canvas
          try {
            panorama.renderer=new THREE.CanvasRenderer();
            panorama.renderer.renderPluginsPre=[];
            panorama.renderer.renderPluginsPost=[];
            $.notify('Cannot initialize WebGL. Canvas 2D used instead, please expect slow rendering results.',{type:'warning',sticky:false});
          } catch (ex) {
            $.notify('Cannot initialize WebGL neither fallback on Canvas 2D.');
            $.notify('Please check your browser configuration and/or compatibilty with HTML5 standards.',{type:'warning'});
            console.log(e);
            return;
          }
        }
      }

      panorama.renderer.setSize($(panorama.container).width(),$(panorama.container).height());
      $(panorama.container).append(panorama.renderer.domElement);

      // TODO: move post-processing in speparate module
      if (panorama.postProcessing) {

        // instantiate composer
        panorama.composer=new THREE.EffectComposer(panorama.renderer);

        // add renderer pass
        panorama.composer.addPass(new THREE.RenderPass(panorama.scene,panorama.camera.instance));

        // add shader passes
        $.each(panorama.postProcessing,function() {
          if (this instanceof Boolean) {
            return true;
          }
          this.pass=new THREE.ShaderPass(this.shader);
          this.pass.enabled=this.enabled;
          var pass=this.pass;
          $.each(this.uniforms,function(uniform,set){
            set.call(pass.uniforms[uniform],panorama);
          });
          panorama.composer.addPass(this.pass);
        });

        // copy result to screen
        if (panorama.postProcessing.renderToScreen!==false) {
          var effect=new THREE.ShaderPass(THREE.CopyShader);
          effect.renderToScreen=true;
          panorama.composer.addPass(effect);
        }

      } // panorama.postProcessing

      panorama.eventsInit();

      panorama.callback('init');

    }, // panorama_init

    // asynchronous callback external methods can hook to using setupCallback below
    callback: function panorama_callback(e){
      var panorama=this;
      if (typeof(e)=='string') {
        e={
          target: panorama,
          type: e,
        };
      } 
      var method='on'+e.type;
      if (panorama[method]) {
        panorama[method].apply(panorama,[e]);
      }
    }, // panorama_callback

    // setup panorama_callback hook for specified instance or prototype
    setupCallback: function panorama_setupCallback(obj) {

      obj.panorama_prototype_callback=Panorama.prototype.callback;

      obj.panorama_callback=function(e) {
         var panorama=this;
         if (typeof(e)=="string") {
           e={
             type: e,
             target: panorama
           }
         }
         if (obj['on_panorama_'+e.type]) {
           if (obj['on_panorama_'+e.type].apply(panorama,[e])===false) {
              return false;
           }
         }
         return obj.panorama_prototype_callback.apply(e.target,[e]);
      }

      Panorama.prototype.callback=obj.panorama_callback;

    }, // panorama_setupCallback

    // update rotation matrix after changing panorama.rotation values
    updateRotationMatrix: function panorama_updateRotationMatrix() {

      var panorama=this;
      panorama.rotation.matrix=new THREE.Matrix4();
      panorama.rotation.matrix.makeRotationAxis(new THREE.Vector3(0, 1, 0),THREE.Math.degToRad(this.rotation.heading));
      panorama.rotation.matrix.multiply((new THREE.Matrix4()).makeRotationAxis(new THREE.Vector3(1,0,0),THREE.Math.degToRad(this.rotation.tilt)));
      panorama.rotation.matrix.multiply((new THREE.Matrix4()).makeRotationAxis(new THREE.Vector3(0,0,1),THREE.Math.degToRad(this.rotation.roll)));

    }, // panorama_updateRotationMatrix

    eventsInit: function panorama_eventsInit(){
      var panorama=this;
      var canvas=$('canvas:first',this.container);
      $(this.container)
      .off('.panorama'+this.num)
      .on('mousedown.panorama'+this.num, canvas, function(e){e.target=panorama;panorama.callback(e)})
      .on('mousemove.panorama'+this.num, canvas, function(e){e.target=panorama;panorama.callback(e)})
      .on('mouseup.panorama'+this.num, canvas, function(e){e.target=panorama;panorama.callback(e)})
      .on('mousewheel.panorama'+this.num, canvas, function(e){e.target=panorama;panorama.callback(e)})
      .on('zoom.panorama'+this.num, canvas, function(e){e.target=panorama;panorama.callback(e)});
      $(window).on('resize.panorama'+this.num, function(e){e.target=panorama;panorama.callback(e)});

    }, // panorama_eventsInit

 /* 
    worldToTextureCoords: function panorama_worldToTextureCoords(worldCoords){
      this.inversePanoramaRotationMatrix=new THREE.Matrix4();
      this.inversePanoramaRotationMatrix.getInverse(this.sphere.object3D.matrix);

      // world to texture coordinates
      var v=worldCoords.clone().applyMatrix4(this.inversePanoramaRotationMatrix);
      var r=v.length();
      var phi=Math.acos(v.z/r);
      var theta=Math.atan2(v.y,v.x);

      var longitude=theta/(Math.PI/180);
      var latitude=phi/(Math.PI/180);

      return {
        longitude: longitude,
        latitude: latitude,
        left: (180+longitude)/360,
        top: (180-latitude)/180
      }
    }, // worldToTextureCoords

    textureToWorldCoords: function panorama_textureToWorldCoords(x,y) {
        var theta=(x*360-180)*(Math.PI/180);
        var phi=(y*180-180)*(Math.PI/180);
        var v=new THREE.Vector4();
        v.x=-this.sphere.radius*Math.sin(phi)*Math.cos(theta);
        v.y=-this.sphere.radius*Math.sin(phi)*Math.sin(theta);
        v.z=this.sphere.radius*Math.cos(phi);
        v.applyMatrix4(this.sphere.object3D.matrix);
        var r=v.length();
        var phi=Math.acos(v.z/r);
        var theta=Math.atan2(v.y,v.x);
        var longitude=theta/(Math.PI/180);
        var latitude=phi/(Math.PI/180);
        return {
          coords: v,
          longitude: longitude,
          latitude: latitude
        }
    }, // textureToWorldCoords
    */

    // set mouseCoords (xyz/phi/theta) and return lon/lat
    getMouseCoords: function panorama_getMouseCoords(e) {

      this.iMatrix=new THREE.Matrix4();
      var matrix=new THREE.Matrix4();
      matrix.multiply(this.camera.instance.projectionMatrix);
//      matrix.multiply(this.viewRotationMatrix);
      this.iMatrix.getInverse(matrix);

      var mouseNear=new THREE.Vector4(0,0,0,1);
      var offset=$(this.renderer.domElement).offset();
      mouseNear.x=-1+2*((e.clientX-offset.left)/this.renderer.domElement.width);
      mouseNear.y=1-2*((e.clientY-offset.top)/this.renderer.domElement.height)
      mouseNear.z=0;

      var mouseFar=mouseNear.clone();
      mouseFar.z=-0.9;

      mouseNear.applyMatrix4(this.iMatrix);
      mouseFar.applyMatrix4(this.iMatrix);

      mouseNear.x/=mouseNear.w;
      mouseNear.y/=mouseNear.w;
      mouseNear.z/=mouseNear.w;
      mouseNear.w=1;

      mouseFar.x/=mouseFar.w;
      mouseFar.y/=mouseFar.w;
      mouseFar.z/=mouseFar.w;
      mouseFar.w=1;

      this.mouseCoords=new THREE.Vector4().subVectors(mouseFar,mouseNear);
      var m=this.mouseCoords;

      var r=Math.sqrt(m.x*m.x+m.y*m.y+m.z*m.z);
      var phi=Math.acos(this.mouseCoords.x/r);
      var theta=Math.atan2(this.mouseCoords.y,this.mouseCoords.z);

      this.mouseCoords.x=-this.sphere.radius*Math.sin(phi)*Math.cos(theta);
      this.mouseCoords.y=-this.sphere.radius*Math.sin(phi)*Math.sin(theta);
      this.mouseCoords.z=-this.sphere.radius*Math.cos(phi);
      this.mouseCoords.phi=phi;
      this.mouseCoords.theta=theta;

      this.getMouseCoords2(e);

      if (true) {
        var lon=THREE.Math.radToDeg(phi);
        var lat=THREE.Math.radToDeg(theta);

        var div=$('#mousecoords');
        if (!div.length) {
          div=$('<div id="mousecoords">').appendTo('body').css({
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 240,
              backgroundColor: "rgba(0,0,0,.6)",
              color: 'white'
          });
        }

        var html='<div style="width: 100%; position: relative; margin-left: 10px;">';
        html+='lon: '+lon.toPrecision(6)+'<br />';
        html+='lat: '+lat.toPrecision(6)+'<br />';
        lon=(lon-90)%360;
        if (lon<0) lon+=360;
        if (lat>90) lat-=180;
        if (lat<-90) lat+=180;
        html+='tx: '+(this.sphere.texture.height/180*lon).toPrecision(6)+'<br />';
        html+='ty: '+(this.sphere.texture.height/180*lat+this.sphere.texture.height/2).toPrecision(6)+'<br />';
        html+='</div>';
        div.html(html);
      }

      return {
        lon: THREE.Math.radToDeg(this.mouseCoords.phi),
        lat: THREE.Math.radToDeg(this.mouseCoords.theta)
      }

    }, // getMouseCoords

    getMouseCoords2: function panorama_getMouseCoords2(e) {

      var panorama=this;
      var camera=panorama.camera.instance;
      var canvas=panorama.renderer.domElement;

      // field of view 
      var fov={
        v: camera.fov,
        h: camera.fov*camera.aspect
      }

      // relative mouse coordinates
      var offset=$(canvas).offset();
      var mouseRel={
        x: e.clientX-offset.left,
        y: e.clientY-offset.top
      }

      // normalized mouse coordinates
      var u=panorama.mouseCoords.u=-1+2*(mouseRel.x/canvas.width);
      var v=panorama.mouseCoords.v=1-2*(mouseRel.y/canvas.height)

      // compute lon/lat here
      // ....

      // return lon/lat
      panorama.mouseCoords.lon=panorama.mouseCoords.lon;
      panorama.mouseCoords.lat=panorama.mouseCoords.lat;

    }, // getMouseCoords2

    onmousedown: function panorama_mousedown(e){
      if (isLeftButtonDown(e)) {
        this.mode.rotate=true;
        e.preventDefault();
        this.mousedownPos={
          lon: this.lon,
          lat: this.lat,
          mouseCoords: this.getMouseCoords(e),
//          textureCoords: this.worldToTextureCoords(this.mouseCoords)
        };
//        console.log(this.mousedownPos.mouseCoords,this.lon,this.lat);
//        var wc=this.textureToWorldCoords(this.mousedownPos.textureCoords.left,this.mousedownPos.textureCoords.top);
//        console.log('fixme: '+this.mousedownPos.textureCoords.longitude+'=='+wc.longitude,this.mousedownPos.textureCoords.latitude+'=='+wc.latitude);
        //TODO something is wrong: this.mousedownPos.textureCoords.latitude != wc.latitude
      }
    },

    onmousemove: function panorama_mousemove(e){
      if (!this.sphere.done) {
        return;
      }

      if (isLeftButtonDown(e)) {
        if (this.mode.rotate) {
          e.preventDefault();
          var mouseCoords=this.getMouseCoords(e);
          this.lon=(this.mousedownPos.lon-(mouseCoords.lon-this.mousedownPos.mouseCoords.lon))%360;
          this.lat=this.mousedownPos.lat-(mouseCoords.lat-this.mousedownPos.mouseCoords.lat);
          if (this.lon<0) this.lon+=360;
          this.drawScene();
        }
      } else {
        this.mode.rotate=false;
      }
    },

    onmouseup: function panorama_mouseup(e){
      this.mode.rotate=false;
    },

    // return current zoom factor
    getZoom: function panorama_getZoom() {
      var visible;
      visible=this.sphere.texture.height*this.camera.instance.fov/180;
      return this.renderer.domElement.height/visible;
    },

    // return current field of view for the largest dimension
    getFov: function() {
      return (this.renderer.domElement.width>this.renderer.domElement.height) ?
        360*((this.renderer.domElement.width*this.camera.zoom.current/4)/this.sphere.texture.height*2) :
        180*((this.renderer.domElement.height*this.camera.zoom.current/2)/this.sphere.texture.height);
    },

    updateFov: function() {

      var fov=this.getFov();

      if (fov>this.fov.max) {
        var fovRatio=fov/this.fov.max;
        fov=this.fov.max;
        this.camera.zoom.current/=fovRatio;
      }

      // convert to vertical fov
      if (this.renderer.domElement.width>this.renderer.domElement.height) {
        fov=fov/this.renderer.domElement.width*this.renderer.domElement.height;
      }

      return fov;
    },

    zoomUpdate: function panorama_zoomUpdate() {
      var fov=this.camera.instance.fov;
      this.camera.zoom.current=1/Math.min(this.camera.zoom.max,Math.max(this.camera.zoom.min,1/this.camera.zoom.current));
      this.camera.instance.fov=this.updateFov();
      if (fov!=this.camera.instance.fov) {
        this.camera.instance.updateProjectionMatrix();
        this.callback('zoom');
        this.drawScene(function(){
          $('canvas:first',this.container).trigger('mousemove');
        });
      }
    },

    setZoom: function panorama_setZoom(e,scale) {
      this.camera.zoom.current=1/scale;
      this.zoomUpdate();
    },

    onmousewheel: function panorama_mousewheel(e){
      e.preventDefault();
      if (!this.sphere.done) {
        return;
      }
      var needDrawScene = false;
      if (e.shiftKey) {
        this.rotation.tilt+=e.deltaX*this.rotation.step;
        this.updateRotationMatrix();
        needDrawScene = true;
      }
      if (e.altKey) {
        this.rotation.roll+=e.deltaY*this.rotation.step;
        this.updateRotationMatrix();
        needDrawScene = true;
      }
      if (needDrawScene) {
        //console.log('lon ['+this.lon+'] lat ['+this.lat+'] tilt ['+this.rotation.tilt+'] roll ['+this.rotation.roll+']');
        this.drawScene();
        return;
      }
      this.camera.zoom.current-=e.deltaY*this.camera.zoom.step;
      this.zoomUpdate();
    },

    drawScene: function panorama_drawScene(callback){
      if (!this.sphere.done) {
        return;
      }
      var panorama=this;
      requestAnimationFrame(function(){
        panorama.renderFrame();
        if (callback) callback();
      });
    },

    renderFrame: function renderFrame() {
      var panorama=this;

      if (!panorama.sphere.done) {
        return;
      }
      panorama.lat=Math.max(panorama.limits.lat.min,Math.min(panorama.limits.lat.max,panorama.lat));

      // set sphere rotation
      panorama.viewRotationMatrix=(new THREE.Matrix4()).makeRotationAxis(new THREE.Vector3(0,0,1),-THREE.Math.degToRad(panorama.lat));
      panorama.viewRotationMatrix.multiply((new THREE.Matrix4()).makeRotationAxis(new THREE.Vector3(0,1,0),THREE.Math.degToRad(panorama.lon)));

      panorama.sphere.object3D.matrixAutoUpdate=false;
      panorama.sphere.object3D.matrix.copy(panorama.rotation.matrix.clone());
      panorama.sphere.object3D.matrix.multiply(panorama.viewRotationMatrix);

      panorama.callback('update');

      panorama.renderer.clear();
      // TODO move post-Processing to jquery.freepano.postprocessing.js
      if (panorama.postProcessing && panorama.postProcessing.enabled) {
        // render scene with postProcessing filters
        panorama.composer.render(panorama.scene,panorama.camera.instance);
      } else {
        // render scene
        panorama.renderer.render(panorama.scene,panorama.camera.instance);
      }

      panorama.callback('render');
    },

    onresize: function panorama_resize(e){
      var panorama=this;
      this.camera.instance.aspect=$(this.container).width()/$(this.container).height();
      this.camera.instance.updateProjectionMatrix();
      this.renderer.setSize($(this.container).width(),$(this.container).height());
      if (this.postProcessing) {
        this.composer.setSize($(this.container).width(),$(this.container).height());
        $.each(this.postProcessing,function() {
          var pass=this.pass;
          if (pass) {
            $.each(this.uniforms,function(uniform,set){
              set.call(pass.uniforms[uniform],panorama);
            });
          }
        });
      }

      setTimeout(function(){
        if (!panorama.sphere.done) {
          return;
        }
        panorama.zoomUpdate();
        panorama.drawScene();
      },0);
    }
}); // extend Panorama.prototype

function isLeftButtonDown(e) {
  return ((e.buttons!==undefined && e.buttons==1) || (e.buttons===undefined && e.which==1));
}

// bind Panorama constructor to jQuery.prototype.panorama
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

Panorama.prototype.setupCallback(Camera.prototype);
