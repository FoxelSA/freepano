/*
 * freepano - WebGL panorama viewer
 *
 * Copyright (c) 2014-2015 FOXEL SA - http://foxel.ch
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
 *      Nils Hamel <n.hamel@foxel.ch>
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

/*
 * TileSet
 * Object Constructor
 */
function TileSet(options) {

    if (!(this instanceof TileSet))
        return new TileSet(options);

    $.extend(true,this,this.defaults,options);
    this.init();

} // Tileset Constructor

/*
 * TileSet
 * Object Prototype
 */
$.extend(true,TileSet.prototype,{

    defaults: {
        dirName: null,
        baseName: null,
        textureOptions: {
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            magFilter: THREE.LinearFilter,
            minFilter: THREE.LinearFilter
            //minFilter: THREE.LinearMipMapNearestFilter
        },
        columns: 2,
        rows: 1,
        tileHeight: 512,
        defaultMaterial: null
    }, // defaults

    /**
     * TileSet.init()
     *
     * Initialize TileSet instance.
     *
     * @return  undefined
     */
    init: function tileSet_init() {

        // default material
        this.defaultMaterial = new THREE.MeshBasicMaterial({
           depthTest: false,
           depthWrite: false
        });

    }, // tileSet_init

    /**
     * TileSet.getTileName()
     *
     * Return the tile texture path based on directory name, basename, column and row
     *
     * @param col   column number
     * @param row   row number
     *
     * @return  String      Tile texture path.
     */
    getTileName: function tileSet_getTileName(col,row) {
        return this.dirName+'/'+this.baseName+'_'+row+'_'+col+'.jpg';
    }, // tileSet_getTileName

    /**
     * TileSet.loadTile_progressive()
     *
     * Create a texture from an image url, update texture onprogress
     *
     * @param url   image url
     * @param mapping   THREE mapping constant
     * @param onload    onload event handler
     * @param onprogress    onprogress event handler
     * @param onerror   onerror event handler
     *
     * @return THREE.Texture object
     */
    loadTile_progressive: function tileSet_loadTile_progressive(url,mapping,onload,onprogress,onerror) {

      var loader = new THREE.ImageLoader();

      var canvas=document.createElement('canvas');
      canvas.width=canvas.height=this.sphere.tileSet.tileHeight;
      var ctx=canvas.getContext('2d');

      var texture=new THREE.Texture(canvas);

      // load a image resource
      loader.load(

        url,

        function _onload( image ) {
          ctx.drawImage( image, 0, 0 );
          texture.needsUpdate=true;
          if (onload) {
            onload(texture);
          }
        },

        function _onprogress( xhr ) {
          ctx.drawImage(this,0,0);
          texture.needsUpdate=true;
          console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
          if (onprogress()){
            onprogress();
          }
        },

        onerror

      );

       return texture;

    }, // tileSet_loadTile_progressive

    /**
    * TileSet.getTileBoundaries
    *
    * Return min and max horizontal and vertical coordinates (in positive
    * radians) of the given tile, in the sphere referential,
    * keeping max > min for looping purposes.
    *
    * @param col    the tile horizontal index
    * @param row    the tile vertical index
    *
    * @return Object  the tile boundaries
    *
    */
    getTileBoundaries: function tileSet_getTileBoundaries(col,row) {

        var tileSet=this;
        var sphere=tileSet.sphere;

        var theta={};
        var phi={};
        var lon={};
        var lat={};

        // compute boundaries in radians
        theta.min=col*tileSet.thetaLength;
        theta.max=theta.min+tileSet.thetaLength;

        phi.min=row*tileSet.phiLength;
        phi.max=phi.min+tileSet.phiLength;

        // clamp and adjust angular values
        function _clamp(value,max) {
          if (value<0) return value+max;
          if (value>=max) return value-max;
          return value;
        }

        theta.min=_clamp(theta.min,Math.PI*2);
        theta.max=_clamp(theta.max,Math.PI*2);
        phi.min=_clamp(phi.min,Math.PI)-Math.PI/2;
        phi.max=_clamp(phi.max,Math.PI)-Math.PI/2;

        // make sure max values are greater than min values
        if (theta.min>theta.max) {
          theta.max+=Math.PI*2;
        }

        if (phi.min>phi.max) {
          phi.max+=Math.PI;
        }

        return {
            theta: theta,
            phi: phi
        }

    } // tileSet_getTileBoundaries


}); // TileSet Prototype


/*
 * Sphere
 * Object Constructor
 */
function Sphere(options) {

    if (!(this instanceof Sphere))
        return new Sphere(options);

    $.extend(true,this,this.defaults,options);
    this.init();

} // Sphere Constructor

/*
 * Sphere
 * Object Prototype
 */
$.extend(true,Sphere.prototype,{

    defaults: {
        tilesToLoad: 0,
        tilesLoaded: 0,
        dynamicTileInit: true,       // load visible tiles first, then all the remaining ones
        dynamicTileLoading: false,   // load only visible tiles
        dynamicTileDisposal: false,  // dispose not visible tiles 
        radius: 150,
        widthSegments: 16,
        heightSegments: 8,
        tileSet: null,
        object3D: null,
        callback: function(){}
    }, // defaults

    /**
     * Sphere.init()
     *
     * Initialize Sphere properties.
     *
     * @return  undefined
     */
    init: function sphere_init() {

        var sphere = this;
        var panorama = sphere.panorama;
        panorama.sphere=sphere;

        // tileSet
        if (sphere.tileSet !== undefined) {
            if (!(sphere.tileSet instanceof TileSet)) {
                sphere.geometryReady = false;
                sphere.tileSet = new TileSet($.extend(sphere.tileSet,{
                  sphere: sphere
                }));
            }
        }

        // sphere segments container
        sphere.object3D = new THREE.Object3D();

        // set initial sphere rotation
        panorama.updateRotationMatrix();

        // build the sphere
        sphere.build();

    }, // sphere_init

    /**
     * Sphere.build()
     *
     * Build sphere.object3D: one mesh per tile using default material.
     * Set sphere.geometryReady to true.
     * Trigger sphere 'geometryready' event
     *
     * @return  undefined
     */
    build: function sphere_build() {

        var sphere = this;

        // tiles count
        var columns = sphere.tileSet.columns;
        var rows = sphere.tileSet.rows;

        // sphere segment angular size
        var thetaLength = sphere.tileSet.thetaLength = 2*Math.PI/columns;
        var phiLength = sphere.tileSet.phiLength = Math.PI/rows;

        // texture height in pixels
        sphere.tileSet.height = rows*sphere.tileSet.tileHeight;

        // sphere radius in pixels
        sphere.r = sphere.tileSet.height/Math.PI;

        // we are inside the sphere, invert the x axis for proper texture mapping
        var transform = new THREE.Matrix4().makeScale(-1,1,1);

        // for each tile
        for(var col=0; col<columns; ++col) {
            for(var row=0; row<rows; ++row) {

                // create sphere segment
                var geometry = new THREE.SphereGeometry(
                    sphere.radius,
                    sphere.widthSegments,
                    sphere.heightSegments,
                    col*thetaLength,
                    thetaLength,
                    row*phiLength,
                    phiLength);

                // invert x axis
                geometry.applyMatrix(transform);

                // create sphere segment mesh
                var mesh = new THREE.Mesh(geometry,sphere.tileSet.defaultMaterial.clone());

                // bind sphere segment properties
                $.extend(true,mesh, {
                    sphere: sphere,
                    col: col,
                    row: row
                });

                // add segment to sphere
                sphere.object3D.add(mesh);

            }
        }

        // mark sphere geometry as done/builded
        sphere.geometryReady = true;

        sphere.dispatch('geometryready');

    }, // sphere_build

    /**
     * Sphere.updateTilesVisibilityStatus()
     *
     * Trigger panorama tiles loading
     * if sphere.dynamicTileLoading is enabled, only visible tiles
     * if sphere.dynamicTileDisposal is enabled, get rid of hidden tiles
     *
     * @return  undefined
     */
    updateTilesVisibilityStatus: function sphere_updateTilesVisibilityStatus() {

        var sphere = this;

        // Load remaining tiles if dynamic loading is enbled
        if (!sphere.dynamicTileLoading) {

          var tilesCount=sphere.tileSet.columns*sphere.tileSet.rows;

          // ... and tiles are not loaded/loading
          if (sphere.tilesLoaded!=tilesCount && !sphere.tilesToLoad) {
            sphere.loadRemainingTiles();
          }

        }

        var panorama=sphere.panorama;
        var canvas=panorama.renderer.domElement;

        // no need to check visibility status if the following parameters didnt change
        if (
            sphere_updateTilesVisibilityStatus.lon==panorama.lon &&
            sphere_updateTilesVisibilityStatus.lat==panorama.lat &&
            sphere_updateTilesVisibilityStatus.fov==panorama.camera.instance.fov &&
            sphere_updateTilesVisibilityStatus.canvas_width==canvas.width &&
            sphere_updateTilesVisibilityStatus.canvas_height==canvas.height
        ) {
          return;
        }

        // limit checking rate
        if (!sphere.updateTilesVisibilityStatus.timeout) {
          sphere.updateTilesVisibilityStatus.timeout=setTimeout(function(){
            sphere.doUpdateTilesVisibilityStatus();
          },100);
        }

    }, // sphere_updateTilesVisibilityStatus

    /**
     * Sphere.doUpdateTilesVisibilityStatus()
     *
     * Called by Sphere.updateTilesVisibilityStatus to avoid throttling
     *
     * Trigger panorama tiles loading
     * if sphere.dynamicTileLoading is enabled, only visible tiles
     * if sphere.dynamicTileDisposal is enabled, get rid of hidden tiles
     *
     * @return  undefined
     */
    doUpdateTilesVisibilityStatus: function sphere_doUpdateTilesVisibilityStatus() {

        var sphere=this;
        var panorama=sphere.panorama;

        console.log('updateTilesVisibilityStatus');

        // store current values
        sphere.updateTilesVisibilityStatus.lon=panorama.lon;
        sphere.updateTilesVisibilityStatus.lat=panorama.lat;
        sphere.updateTilesVisibilityStatus.fov=panorama.camera.instance.fov;
        sphere.updateTilesVisibilityStatus.canvas_widht=panorama.renderer.domElement.width;
        sphere.updateTilesVisibilityStatus.canvas_widht=panorama.renderer.domElement.height;

        // for every tile
        $.each(sphere.object3D.children, function() {

            var mesh = this;

            if (sphere.panorama.camera.frustum.intersectsObject(mesh)) {

                // nothing to do if rendering is enabled for this tile
                if (mesh._visible) {
                    return;
                }

                // enable rendering for this tile
                mesh.visible=true;

                // tag as visible
                mesh._visible = true;

                // announce it
                mesh.dispatch('visibilitychange');

            } else {

                // nothing to do if rendering is disabled for this tile
                if (!mesh._visible){
                  return;
                }

                // tag as invisible
                mesh._visible = false;

                mesh.dispatch('visibilitychange');
            }
        });

        sphere.updateTilesVisibilityStatus.timeout=null;

    }, // sphere_doUpdateTilesVisibilityStatus


    /**
    * Sphere.on_mesh_visibilitychange()
    *
    * Trigger dynamic tile loading or disposal on visibility status change
    *
    */
    on_mesh_visibilitychange: function sphere_on_mesh_visibilitychange(e) {
        var mesh=this;
        var sphere=mesh.sphere;

        // Trigger loading of tiles - Only for visible tiles if dynamic loading is enabled
        if (!sphere.dynamicTileLoading || mesh._visible) {

            // do nothing for tiles already requested
            if (mesh.material.map && mesh.material.map.requested)
                return;

            // trigger loading for this tile
            mesh.material.map=sphere.loadTile(mesh.col,mesh.row);
            mesh.material.needsUpdate = true;

            // make it known
            mesh.material.map.requested=true;

        } else {
            // -> dynamic loading is enabled AND tile is out of view

            // dispose hidden tile texture/material if requested
            if (sphere.dynamicTileDisposal) {

                // has texture
                if (mesh.material && mesh.material.map) {

                    // dispose texture and material
                    mesh.material.map.dispose();
                    mesh.material.dispose();

                    // default material
                    mesh.material = sphere.tileSet.defaultMaterial.clone();
                }
            }
        }

    }, // sphere_on_mesh_visibilitychange

    /**
     * Sphere.loadTile()
     *
     * Load a tile image
     * Trigger sphere 'tileload' when the tile is loaded
     * Trigger sphere 'load' if all the requested tiles have been loaded
     *
     * @param col   column number
     * @param row   row number
     *
     * @return  THREE.Texture instance
     */
    loadTile: function sphere_loadTile(col,row) {

        var sphere = this;

        ++sphere.tilesToLoad;

        // load the texture
        var tileTexture = THREE.ImageUtils.loadTexture(sphere.tileSet.getTileName(col,row),THREE.UVMapping,
            // onload
            function loadTexture_onload(texture) {

                sphere.dispatch('tileload');

                --sphere.tilesToLoad;
                if (!sphere.tilesLoaded) sphere.tilesLoaded=0;
                ++sphere.tilesLoaded;
                if (!sphere.tilesToLoad) {
                  sphere.dispatch('load');
                }
            },
            // onerror
            function loadTexture_onerror() {
                $.notify('Cannot load panorama tiles.');
            }
        );

        // texture properties
        $.extend(tileTexture,sphere.tileSet.textureOptions);

        return tileTexture;

    }, // sphere_loadTile

    /**
     * Sphere.loadTile_progressive()
     *
     * Load a tile image progressively
     * Trigger sphere 'tileload' when the tile is loaded or onprogress
     * Trigger sphere 'load' if all the requested tiles have been loaded
     *
     * @param col   column number
     * @param row   row number
     *
     * @return  THREE.Texture instance
     */
    loadTile_progressive: function sphere_loadTile(col,row) {

      var sphere=this;

      ++sphere.tilesToLoad;

      var tileTexture = this.texture.progressiveLoad(sphere.tileSet.getTileName(col,row),THREE.UVMapping,

            // load event handler
            function loadTexture_onload(texture) {

                sphere.dispatch('tileload');

                if (!sphere.tilesLoaded) {
                  sphere.tilesLoaded=0;
                }
                ++sphere.tilesLoaded;

                --sphere.tilesToLoad;
                if (!sphere.tilesToLoad) {
                  sphere.dispatch('load');
                }
            },

            // progress event handler
            function loadTexture_onProgress() {
              sphere.dispatch('tileload');
            },

            // error event handler
            function loadTexture_onerror() {
                $.notify('Cannot load panorama tiles.');
            }
        );

        // texture properties
        $.extend(tileTexture,sphere.tileSet.options);

        return tileTexture;

    }, // sphere_loadTile_progressive

    /**
     * Sphere.tileSetChanged()
     *
     * Trigger panorama tiles loading after sphere tileSet change
     *
     * @return  undefined
     */
    tileSetChanged: function sphere_tileSetChanged() {

        var sphere = this;
        var panorama=this.panorama;

        // set all mesh as not visible
        // this will cause the tiles to be reloaded
        $.each(sphere.object3D.children, function() {
            var mesh=this;
            if (mesh.material) {
                if (mesh.material.map &&  mesh.material.map.requested) {
                    mesh.material.map.dispose();
                    mesh.material.dispose();
                    // default material
                    mesh.material = sphere.tileSet.defaultMaterial.clone();
                }
            }
            mesh.visible = mesh._visible = false;
        });

        // reset sphere.updateTile() related properties
        sphere.tilesLoaded=0;
        sphere.tilesToLoad=0;
        panorama.sphere.panoramaReadyTriggered=false;

        // load visible tiles first
        if (sphere.dynamicTileInit) {
          sphere.dynamicTileLoading=true;
        }

        // trigger tiles loading
        sphere.updateTilesVisibilityStatus();

    }, // sphere_tileSetChanged

    /**
    * Sphere.loadRemainingTiles()
    *
    * Trigger loading of unrequested tiles
    *
    *
    */
    loadRemainingTiles: function sphere_loadRemainingTiles() {

      var sphere=this;

      $.each(sphere.object3D.children, function() {
          var mesh = this;

          // nothing to do if rendering is enabled for this tile or image already requested
          if (mesh._visible || (mesh.material && mesh.material.map && mesh.material.map.requested)) {
              return;
          }

          // trigger loading for this tile
          mesh.material.map=sphere.loadTile(mesh.col,mesh.row);
          mesh.material.needsUpdate = true;

          // make it known
          mesh.material.map.requested=true;
      });
    }

}); // Sphere Prototype


/*
 * Camera
 * Object Constructor
 */
function Camera(options) {

    if (!(this instanceof Camera))
        return new Camera(options);

    $.extend(true,this,this.defaults,options);
    this.init();

} // Camera Constructor

/*
 * Camera
 * Class Prototype
 */
$.extend(true,Camera.prototype,{

    defaults: {
        fov: 120,
        nearPlane: 0.1,
        farPlane: Sphere.prototype.defaults.radius*2,
        zoom: {
            max: 2.5,
            min: 0.5,
            step: 0.05,
            current: 1
        },
        frustum: new THREE.Frustum(),
        viewProjectionMatrix: new THREE.Matrix4()
    }, // defaults

    /**
     * Camera.init()
     *
     * Initialize Camera properties.
     *
     * @return  undefined
     */
    init: function camera_init() {

        var camera = this;

        // perspective camera
        camera.instance=new THREE.PerspectiveCamera(
            camera.fov,
            $(camera.panorama.container).width()/$(camera.panorama.container).height(),
            camera.nearPlane,
            camera.farPlane
        );

    }, // camera_init

    /**
     * Camera.updateFrustum()
     *
     * Update the camera frustum object according to the camera view projection matrix.
     *
     * @return  undefined
     */
    updateFrustum: function camera_updateFrustum() {

        var camera = this;

        // camera view projection matrix
        camera.viewProjectionMatrix.multiplyMatrices(camera.instance.projectionMatrix,camera.instance.matrixWorldInverse);

        // set frustum from camera projection matrix
        camera.frustum.setFromMatrix(camera.viewProjectionMatrix);

    }, // camera_updateFrustum

    /**
     * Camera.on_panorama_resize()
     *
     * Camera handler for panorama resize. Update the frustrum object.
     *
     * @return  undefined
     */
    on_panorama_resize: function camera_on_panorama_resize(e) {
        this.camera.updateFrustum();
    }, // camera_on_panorama_resize

    /**
     * Camera.on_panorama_zoom()
     *
     * Camera handler for panorama zoom event. Update the frustrum object.
     *
     * @return  undefined
     */
    on_panorama_zoom: function camera_on_panorama_zoom(e) {
        this.camera.updateFrustum();
    }, // camera_on_panorama_zoom

    on_panorama_rotate: function camera_on_panorama_rotate(e) {
        // update frustum
        this.camera.updateFrustum();
    },

}); // Camera Prototype


/*
 * Panorama
 * Object Constructor
 */
function Panorama(options) {

    if (!(this instanceof Panorama))
        return new Panorama(options);

    $.extend(true,this,this.defaults,options);
    this.init();

} // Panorama Constructor

/*
 * Panorama
 * Object Prototype
 */
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
                precision: 'highp',
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
        mouseCoords: new THREE.Vector3(),
        mousedownPos: {},
        rotation: {
            heading: 0,
            tilt: 0,
            roll: 0,
            step: 0.1
        },
        initialRotation: new THREE.Matrix4(),
        limits: {
            lat: {
                min: -85,
                max: 85
            }
        },
        showMouseInfo: false,
        Xaxis: new THREE.Vector3(1,0,0),
        Yaxis: new THREE.Vector3(0,1,0),
        Zaxis: new THREE.Vector3(0,0,1),
        rotationMouseThreshold: 10
    }, // defaults

    /**
     * Panorama.init()
     *
     * Initialize Panorama properties, including Scene, Camera, Sphere, WebGL
     * renderer and Effects/Shaders, event handlers
     *
     * Trigger panorama 'preinit' and 'init' events
     *
     * @return  undefined
     */
    init: function panorama_init() {

        var panorama = this;
        $(panorama.container).data('pano',panorama);

        // scene
        panorama.scene = new THREE.Scene();

        // trigger preinit event
        panorama.dispatch('preinit');

        // renderer
        if (!(panorama.renderer instanceof THREE.WebGLRenderer)) {

            // webgl renderer
            try {
                panorama.renderer=$.extend(new THREE.WebGLRenderer(panorama.renderer.parameters),panorama.renderer.properties);
                panorama.renderer.setPixelRatio(window.devicePixelRatio);

            // canvas 2d fallback
            } catch(e) {

                try {

                    panorama.renderer = new THREE.CanvasRenderer();
                    panorama.renderer.renderPluginsPre = [];
                    panorama.renderer.renderPluginsPost = [];

                    // notify user
                    $.notify('Cannot initialize WebGL. Canvas 2D used instead, please expect slow rendering results.',{type:'warning',sticky:false});

                // even canvas 2d is failing
                } catch (ex) {

                    $.notify('Cannot initialize WebGL neither fallback on Canvas 2D.');
                    $.notify('Please check your browser configuration and/or compatibilty with HTML5 standards.',{type:'warning'});

                    // log error in console for debugging purpose
                    console.log(e);

                    // quit
                    return;

                }
            }
        }

        // renderer dom element
        panorama.renderer.setSize($(panorama.container).width(),$(panorama.container).height());
        $(panorama.container).append(panorama.renderer.domElement);

        // camera
        if (!(panorama.camera instanceof Camera)) {
            panorama.camera = new Camera($.extend(true,{
                panorama: panorama,
                fov: panorama.fov.start
            },panorama.camera));
        }

        // post-processing
        // @todo: move post-processing in a separate module
        if (panorama.postProcessing) {

            // effect composer
            panorama.composer = new THREE.EffectComposer(panorama.renderer);

            // add render pass
            panorama.composer.addPass(new THREE.RenderPass(panorama.scene,panorama.camera.instance));

            // shader passes
            $.each(panorama.postProcessing, function() {

                if (this.constructor.name=='Boolean')
                    return true;

                // shader pass
                this.pass = new THREE.ShaderPass(this.shader);
                this.pass.enabled = this.enabled;

                // uniforms calls
                var pass = this.pass;
                $.each(this.uniforms, function(uniform,_set) {
                    _set.call(pass.uniforms[uniform],panorama);
                });

                // add pass to composer
                panorama.composer.addPass(this.pass);

            });

            // copy result to screen
            if (panorama.postProcessing.renderToScreen !== false) {

                // copy shader pass
                var effect = new THREE.ShaderPass(THREE.CopyShader);
                effect.renderToScreen = true;

                // add pass to composer
                panorama.composer.addPass(effect);

            }
        }

        // sphere
        if (panorama.sphere !== undefined) {

            // instance
            if (!(panorama.sphere instanceof Sphere)) {
                panorama.sphere = new Sphere($.extend(true,{
                    panorama: panorama
                },panorama.sphere));
            }

            // add sphere to panorama
            panorama.scene.add(panorama.sphere.object3D);

        }

        // init panorama events
        panorama.eventsInit();

        // trigger init event
        panorama.dispatch('init');

    }, // panorama_init

    /**
     * Panorama.on_sphere_tileload()
     * Panorama 'sphere_tileload' event handler, is run each time a tile is loaded
     * @return  undefined
     *
     */
    on_sphere_tileload: function panorama_on_sphere_tileload(e) {
      var sphere=this;
      var panorama=this.panorama;
      panorama.camera.updateFrustum();
      setTimeout(function() {
         sphere.panorama.drawScene();
      },0);
    }, // panoram_on_sphere_tileload

    /**
     * Panorama.on_sphere_load()
     * Panorama 'sphere_load' event handler, is run each time a tile (sub)set is loaded
     *
     * Trigger loading remaining tiles when sphere.dynamicTileInit is true
     * Trigger panorama 'resize' and 'ready' event
     *
     * @return undefined
     */
    on_sphere_load: function panorama_on_sphere_load(e) {
      var sphere=this;
      var panorama=this.panorama;

      // dont trigger panorama ready after each sphere.updateTiles() call
      if (!sphere.panoramaReadyTriggered) {

        // dynamicTileInit is enabled and there remains tiles to load
        if (sphere.dynamicTileInit && sphere.tilesLoaded!=sphere.tileSet.columns*sphere.tileSet.rows) {
          sphere.loadRemainingTiles();
          sphere.dynamicTileLoading=false;

          // Dont trigger panorama ready event before all tiles are loaded
          return;
        }

        panorama.dispatch('resize');
        panorama.dispatch('ready');
        sphere.panoramaReadyTriggered=true;
      }

    }, // panorama_on_sphere_load

    /**
     * Panorama.on_sphere_geometryready()
     *
     * Panorama 'sphere_geometryready' event handler.
     * Initial panorama render (no textures loaded yet)
     *
     * @return undefined
     */
    on_sphere_geometryready: function panorama_on_sphere_geometryready() {
      var panorama=this.panorama;
      panorama.dispatch('resize');
      panorama.drawScene();
    },

    /**
     * Panorama.eventsInit()
     * Initialize Panorama events.
     *
     * @return  undefined
     */
    eventsInit: function panorama_eventsInit() {

        var panorama = this;

        // renderer canvas
        var canvas=panorama.renderer.domElement;

        // container events
        $(this.container)
            .off('.panorama'+this.num)
            .on('mousedown.panorama'+this.num, canvas, function(e) {
                e.target = panorama;panorama.dispatch(e);
            })
            .on('mousemove.panorama'+this.num, canvas, function(e) {
                e.target = panorama;panorama.dispatch(e);
            })
            .on('mouseup.panorama'+this.num, canvas, function(e) {
                e.target = panorama;panorama.dispatch(e);
            })
            .on('mousewheel.panorama'+this.num, canvas, function(e) {
                e.target = panorama;panorama.dispatch(e);
            })
            .on('zoom.panorama'+this.num, canvas, function(e) {
                e.target = panorama;panorama.dispatch(e);
            });

        // window resize
        $(window).on('resize.panorama'+this.num, function(e) {
            e.target = panorama;panorama.dispatch(e);
        });

    }, // panorama_eventsInit

    /**
     * updateRotationMatrix()
     * Update the sphere rotation matrix based on X,Y,Z axis. This method must
     * be called after changing the panorama rotation values.
     *
     * @return  undefined
     */
    updateRotationMatrix: function panorama_updateRotationMatrix() {

        var panorama = this;

        // panorama initial rotation
        var R = panorama.initialRotation.clone();

        // combine with rotation angles
        R.multiply((new THREE.Matrix4()).makeRotationAxis(panorama.Xaxis,THREE.Math.degToRad(panorama.rotation.tilt)));
        R.multiply((new THREE.Matrix4()).makeRotationAxis(panorama.Yaxis,THREE.Math.degToRad(panorama.rotation.heading)));
        R.multiply((new THREE.Matrix4()).makeRotationAxis(panorama.Zaxis,THREE.Math.degToRad(panorama.rotation.roll)));

        // set sphere rotation from computed matrix
        panorama.sphere.object3D.rotation.setFromRotationMatrix(R);

    }, // panorama_updateRotationMatrix

    /**
     * getTextureCoordinates()
     * Return the top/left coordinates on the texture based on latitude/longitude.
     *
     * @return  Object      Top and left coordinates as an Object.
     */
    getTextureCoordinates: function panorama_getTextureCoordinates(lon,lat) {

        var panorama = this;

        // step
        var step = panorama.sphere.tileSet.height/180;

        // normalize longitude
        lon = (lon-180) % 360;
        if (lon < 0)
            lon += 360;

        // top/left
        return {
            top: panorama.sphere.tileSet.height-(step*(lat+90)),
            left: step*lon
        };

    }, // panorama_getTextureCoordinates

    /**
     * getMouseCoords()
     * Return the latitude/longitude coordinates relative to the mouse pointer.
     * This method also sets the mouse coordinates xyz/phi/theta vector
     *
     * @return  Object      Latitude and longitude coordinates as an Object.
     */
    getMouseCoords: function panorama_getMouseCoords(e) {

        var panorama = this;

        // field of view
        var fov = {
            v: panorama.camera.instance.fov,
            h: panorama.camera.instance.fov * panorama.camera.instance.aspect
        };

        // relative mouse coordinates
        var offset = $(panorama.renderer.domElement).offset();
        var mouseRel = {
            x: e.clientX-offset.left,
            y: e.clientY-offset.top
        };

        // model-view matrix
        var modelViewMatrix = new THREE.Matrix4().multiplyMatrices(panorama.camera.instance.matrixWorldInverse,panorama.sphere.object3D.matrixWorld);
        var mat_view = modelViewMatrix.elements;

        // camera projection matrix
        var mat_proj = panorama.camera.instance.projectionMatrix.elements;

        // retrieve frustum parameters from projection matrix
        var near = mat_proj[14] / ( 2.0 * ( mat_proj[10] - 1.0 ) );
        var righ = near / mat_proj[0];
        var heig = near / mat_proj[5];

        // compute sphere point vector in gl frame
        var posi = Array(3);
        posi[0] = - righ + righ * 2.0 * mouseRel.x / ( panorama.renderer.domElement.width - 1 );
        posi[1] = + heig - heig * 2.0 * mouseRel.y / ( panorama.renderer.domElement.height - 1 );
        posi[2] = - near;

        // compute sphere point vector norm
        var norm = Math.sqrt( posi[0] * posi[0] + posi[1] * posi[1] + posi[2] * posi[2] );

        // normalize sphere point position
        posi[0] /= norm;
        posi[1] /= norm;
        posi[2] /= norm;

        // get mouse coordinates in the camera referential
        var cursor = panorama.cursorCoords = {
            vector: new THREE.Vector3(posi[0],posi[1],posi[2]).multiplyScalar(panorama.sphere.radius),
            phi: Math.acos(posi[1]),
            theta: Math.atan2(posi[2],posi[0])
        };
        cursor.lon = THREE.Math.radToDeg(cursor.theta);
        cursor.lat = THREE.Math.radToDeg(cursor.phi);

        // set mouse canvas coordinates
        cursor.pageX = mouseRel.x;
        cursor.pageY = mouseRel.y;

        // remove linear transformation
        var posf = Array(3);
        posf[0] = mat_view[0] * posi[0] + mat_view[1] * posi[1] + mat_view[2] * posi[2];
        posf[1] = mat_view[4] * posi[0] + mat_view[5] * posi[1] + mat_view[6] * posi[2];
        posf[2] = mat_view[8] * posi[0] + mat_view[9] * posi[1] + mat_view[10] * posi[2];

        // compute ellipsoidal coordinates
        var lam = Math.atan2(posf[2],posf[0]);
        var phi = Math.asin(posf[1]);

        // normalize longitude
        lam = ( lam >= 0 ) ? lam : lam + ( Math.PI * 2.0 );

        // full panorama size
        var texture_w = panorama.sphere.tileSet.height * 2;
        var texture_h = panorama.sphere.tileSet.height;

        // set mouse coordinates accordingly
        var m = panorama.mouseCoords;
        m.set(posf[0]*panorama.sphere.radius,posf[1]*panorama.sphere.radius,posf[2]*panorama.sphere.radius);

        // set mouse ellipsoidal coordinates
        m.phi = phi;
        m.theta = lam;

        // set mouse texture coordinates
        m.pixel_x = (lam / (2.0 * Math.PI) ) * texture_w;
        m.pixel_y = ((Math.PI * 0.5 - phi) / Math.PI) * texture_h;

        // set mouse lam/phi (lon/lat) degrees
        m.lon = lam * (180/Math.PI);
        m.lat = phi * (180/Math.PI);

        // adjust lon/lat
        m.lon = -(90 - m.lon) - 90;
        m.lat = m.lat;
        if (m.lon < 0)
            m.lon += 360;

        // debug
        if (panorama.showMouseInfo)
            panorama.showMouseDebugInfo(m);

        return cursor;

    }, // panorama_getMouseCoords

    /**
     * Panorama.getZoom()
     *
     * Return the current zoom factor.
     *
     * @return  number       Current zoom factor.
     */
    getZoom: function panorama_getZoom() {
        var visible = this.sphere.tileSet.height * this.camera.instance.fov / 180;
        return this.renderer.domElement.height/visible;
    }, // panorama_getZoom

    /**
     * Panorama.zoomUpdate()
     * Update camera fov according to camera zoom
     * Redraw panorama, trigger 'zoom' and 'mousemove' if value changed
     *
     * @return  undefined
     */
    zoomUpdate: function panorama_zoomUpdate() {

        var panorama = this;

        // current camera vertical fov
        var fov = panorama.camera.instance.fov;

        // current zoom
        panorama.camera.zoom.current = 1/Math.min(panorama.camera.zoom.max,Math.max(panorama.camera.zoom.min,1/panorama.camera.zoom.current));

        // adjust camera vertical fov depending on the zoom and canvas dimensions
        panorama.camera.instance.fov = panorama.adjustFov();

        // fov changed ?
        if (fov != panorama.camera.instance.fov) {

            // update the projection matrix
            panorama.camera.instance.updateProjectionMatrix();

            // trigger zoom event
            panorama.dispatch('zoom');

            // redraw the scene
            panorama.drawScene();
        }

    }, // panorama_zoomUpdate

    /**
     * panorama.adjustFov()
     *
     * Adjust the camera vertical field of view , given the zoom level,
     * the panorama fov limit, and the longest canvas dimension (for
     * which the panorama fov limit must apply)
     *
     * @return  number       camera vertical field of view
     */
    adjustFov: function panorama_adjustFov() {

      var panorama=this;

      var fov=panorama.getFov();

      if (fov>panorama.fov.max) {
        var fovRatio=fov/panorama.fov.max;
        fov=panorama.fov.max;
        panorama.camera.zoom.current/=fovRatio;
      }

      // convert to vertical fov when canvas is in landscape mode
      if (panorama.renderer.domElement.width>panorama.renderer.domElement.height) {
        fov=fov/panorama.renderer.domElement.width*panorama.renderer.domElement.height;
      }

      return fov;

    }, // panorama_adjustFov

    /**
     * Panorama.onmousedown()
     *
     * Panorama mousedown event handler
     *
     * Store the mouse position for future mouse events.
     *
     * If left button is down, enter panorama "mayrotate" mode,
     * If another button was pressed, exit "mayrotate" and "rotate" modes
     *
     * @return  undefined
     */
    onmousedown: function panorama_onmousedown(e) {

        var panorama = this;

        // left button
        if (isLeftButtonDown(e)) {

            e.preventDefault();

            // flags
            panorama.mode.leftButtonDown = true;
            panorama.mode.mayrotate = true;

            // position
            this.mousedownPos = {
                lon: panorama.lon,
                lat: panorama.lat,
                cursorCoords: panorama.getMouseCoords(e)
            };

        // another button
        } else {
            panorama.mode.leftButtonDown = false;
            panorama.mode.mayrotate = false;
            panorama.mode.rotate = false;
        }

    }, // panorama_onmousedown

    /**
     * Panorama.onmousemove()
     *
     * Panorama mousemove event handler.
     *
     * While the panorama "mayrotate" mode is enabled, check wether the
     * the panorama rotation mode has to be enabled (distance in screen
     * coordinates the cursor travelled since the left button mousedown
     * must reach the threshold)
     *
     * While panorama "rotate" mode is enabled, rotate the panorama according
     * to the distance the cursor travelled in spherical coordinates since the
     * left button mousedown event was triggered.
     *
     * @return  undefined
     */
    onmousemove: function panorama_onmousemove(e) {

        var panorama = this;

        // sphere is not ready
        if (!panorama.sphere.geometryReady)
            return;

        // dont run handler twice for the same event instance (bug happends)
        if (e.done) {
            console.log('fixme');
            return;
        }
        e.done = true;

        // left button
        if (isLeftButtonDown(e)) {

            // mouse coordinates
            var cursorCoords = panorama.getMouseCoords(e);

            // rotation didnt start yet ?
            if (panorama.mode.mayrotate) {
                // dont enter rotate mode when initial mousemove is less than panorama.rotationMouseThreshold pixels
                var dx=cursorCoords.pageX-panorama.mousedownPos.cursorCoords.pageX;
                var dy=cursorCoords.pageY-panorama.mousedownPos.cursorCoords.pageY;
                if (Math.sqrt(dx*dx+dy*dy)<panorama.rotationMouseThreshold) {
                    return;
                }

                // enter rotate mode
                panorama.mode.mayrotate=false;
                panorama.mode.rotate=true;
            }

            // rotation mode is enabled ?
            if (panorama.mode.rotate) {

                e.preventDefault();

                // compute latitude/longitude
                panorama.lon = (panorama.mousedownPos.lon-(cursorCoords.lon-panorama.mousedownPos.cursorCoords.lon))%360;
                panorama.lat = panorama.mousedownPos.lat+(cursorCoords.lat-panorama.mousedownPos.cursorCoords.lat);
                if (panorama.lon<0)
                    panorama.lon+=360;

                // trigger rotate event
                panorama.dispatch('rotate');

                // redraw the scene
                panorama.drawScene();

            }

        } else {
            // exit rotate mode
            panorama.mode.mayrotate = false;
            panorama.mode.rotate = false;
            panorama.mode.leftButtonDown=false;
        }

    }, // panorama_onmousemove

    /**
     * Panorama.onmouseup()
     *
     * mouseup event handler.
     *
     * Exit panorama 'rotate' and 'mayrotate' modes.
     * Trigger panorama 'click' event if no rotation occured and
     * left mousedown was located on panorama canvas.
     *
     * @param e   event object
     *
     * @return  undefined
     */
    onmouseup: function panorama_onmouseup(e) {

        var panorama = this;

        // keep
        var leftButtonUp = panorama.mode.leftButtonDown;
        var rotating = panorama.mode.rotate;

        // flags
        panorama.mode.rotate = false;
        panorama.mode.mayrotate = false;
        panorama.mode.leftButtonDown = false;

        // don't trigger click event after rotation,
        // nor when mousedown was not located on panorama
        if (!rotating && leftButtonUp) {
            e.type = 'click';

            // trigger click event
            panorama.dispatch(e);
        }

    }, // panorama_onmouseup

    /**
     * Panorama.showMouseDebugInfo()
     * Display mouse information over the renderer. Debug purposes only.
     *
     * @return  undefined
     */
    showMouseDebugInfo: function panorama_showMouseDebugInfo(vector) {

        var div = $('#mouseDebugInfo');

        // create div
        if (!div.length) {
            div = $('<div id="mouseDebugInfo">').appendTo(this.container).css({
                position: 'absolute',
                top: 0,
                right: 0,
                width: 128,
                backgroundColor: "rgba(0,0,0,.4)",
                color: 'white'
            });
        }

        // data
        var html = '<div style="width:100%;position:relative;margin-left:10px;">'
//                        + 'x: ' + vector.x.toPrecision(6) + '<br />'
//                        + 'y: ' + vector.y.toPrecision(6) + '<br />'
//                        + 'z: ' + vector.z.toPrecision(6) + '<br />'
                        + 'lon: ' + vector.lon.toPrecision(6) + '<br />'
                        + 'lat: ' + vector.lat.toPrecision(6) + '<br />'
                        + 'tex x: ' + vector.pixel_x.toPrecision(6) + '<br />'
                        + 'tex y: ' + vector.pixel_y.toPrecision(6) + '<br />'
                    + '</div>';

        // display
        div.html(html);

    }, // panorama_showMouseDebugInfo

    /*
    textureToWorldCoords: function panorama_textureToWorldCoords(x,y) {

        var panorama = this;

        var step = panorama.sphere.tileSet.height/180;
        var theta = (x*step)*(Math.PI/180);
        var phi = (90-(y*step))*(Math.PI/180);

        var v = new THREE.Vector4();
        v.x = this.sphere.radius*Math.sin(phi)*Math.cos(theta);
        v.y = this.sphere.radius*Math.sin(phi)*Math.sin(theta);
        v.z = this.sphere.radius*Math.cos(phi);

        v.normalize();
        v.applyMatrix4(this.sphere.object3D.matrix);

        var r = Math.sqrt(v.x*v.x+v.y*v.y+v.z*v.z);
        var phi = Math.acos(v.y/r);
        var theta = Math.atan2(v.z,v.x);

        var lon = theta/(Math.PI/180);
        var lat = phi/(Math.PI/180);

        return {
            coords: v,
            lon: lon,
            lat: lat
        };

    }, // panorama_textureToWorldCoords
    */

    /**
     * getNormalizedMouseCoords() -- unused
     * ...
     *
     * @return  ...
     */
    /*
    getNormalizedMouseCoords: function panorama_getNormalizedMouseCoords(e){

        var panorama = this;

        var canvas = panorama.renderer.domElement;
        var offset = $(canvas).offset();

        return {
            x: ((e.clientX-offset.left) / canvas.width) * 2 - 1,
            y: -((e.clientY-offset.top) / canvas.height) * 2 + 1
        };

    }, // panorama_getNormalizedMouseCoords
    */

    /**
     * getMouseCoords() -- unused
     * ...
     *
     * @return  ...
     */
    /*
    getMouseCoords: function panorama_getMouseCoords(event) {

        var panorama = this;
        var canvas = panorama.renderer.domElement;

        var offset = $(canvas).offset();

        // get normalized mouse coordinates
        var vector = new THREE.Vector3(((event.clientX-offset.left) / canvas.width) * 2 - 1, -((event.clientY-offset.top) / canvas.height) * 2 + 1, 0.5);

        // get mouse coordinates in the camera referential
        vector.applyMatrix4(new THREE.Matrix4().getInverse(panorama.camera.instance.projectionMatrix));
        vector.normalize();

        // store mouse coordinates in the camera referential
        var cursor = panorama.cursorCoords= {
            vector: vector.clone().multiplyScalar(panorama.sphere.radius),
            phi: Math.acos(vector.y),
            theta: Math.atan2(vector.z,vector.x)
        };

        cursor.lon = THREE.Math.radToDeg(cursor.theta);
        cursor.lat = THREE.Math.radToDeg(cursor.phi);

        var info = cursor.vector.clone();
        info.lat = cursor.lat;
        info.lon = cursor.lon;

        // get mouse coordinates in the sphere referential
        vector.applyMatrix4(panorama.camera.instance.matrixWorld);
        vector.applyMatrix4(new THREE.Matrix4().getInverse(panorama.sphere.object3D.matrix));

        // cartesian to spheric coordinates
        var m = panorama.mouseCoords = vector;
        var phi = Math.acos(m.y);
        var theta = Math.atan2(m.z, m.x);

        // adjust lon/lat
        m.lon = -(90 - THREE.Math.radToDeg(theta)) - 90;
        m.lat = 90 - THREE.Math.radToDeg(phi);
        if (m.lon < 0)
            m.lon += 360;

        // store mouse coordinates in the sphere referential
        m.multiplyScalar(panorama.sphere.radius);
        this.mouseCoords = {
            lon: m.lon,
            lat: m.lat,
            x: m.x,
            y: m.y,
            z: m.z
        };

        // return coordinates in the camera referential
        return {
            lon: cursor.lon,
            lat: cursor.lat
        };

    }, // panorama_getMouseCoords
    */

    /** Panorama.getFov
    *
    *  Given the canvas dimensions, the current zoom and the panorama height,
    *  return current field of view for the largest canvas dimension,
    *  which differs from the camera fov in landscape mode.
    *
    * @return number
    */
    getFov: function() {
      return (this.renderer.domElement.width>this.renderer.domElement.height) ?
        360*((this.renderer.domElement.width*this.camera.zoom.current/4)/this.sphere.tileSet.height*2) :
        180*((this.renderer.domElement.height*this.camera.zoom.current/2)/this.sphere.tileSet.height);
    },

    /** Panorama.setPixelScale
     *
     * Set panorama pixel scale
     *
     * @return undefined
     */
    setPixelScale: function panorama_setPixelScale(scale) {
      this.camera.zoom.current=1/scale;
      this.zoomUpdate();
    }, // panorama_setPixelScale

    /**
     * Panorama.onmousewheel()
     *
     * Panorama mousewheel event handler.
     *
     * Without modifiers, zoom the panorama in and out.
     * Width shift, adjust the tilt.
     * With Alt, adjust the roll.
     *
     * @param e    event object
     *
     * @return  undefined
     */
    onmousewheel: function panorama_mousewheel(e){

      var panorama=this;

      // disable scrolling
      e.preventDefault();

      // scene is not ready
      if (!panorama.sphere.geometryReady) {
        return;
      }

      // on shiftKey down, adjust rotation
      if (e.shiftKey) {
        panorama.rotation.tilt+=e.deltaX*panorama.rotation.step;
        panorama.updateRotationMatrix();
        panorama.drawScene();
        return;
      }

      // on altKey down, adjust tilt
      if (e.altKey) {
        panorama.rotation.roll+=e.deltaY*panorama.rotation.step;
        panorama.updateRotationMatrix();
        panorama.drawScene();
        return;
      }

      // without modifiers, adjust zoom
      panorama.camera.zoom.current-=e.deltaY*panorama.camera.zoom.step;
      if (panorama.camera.zoom.current<0) panorama.camera.zoom.current=0;
      panorama.zoomUpdate();

    }, // panorama_onmousewheel

    /**
     * Panorama.drawScene()
     *
     * Trigger an animation frame request and run callback after rendering
     * @todo: check if callback is run on throttling condition (need a callback queue ?)
     *
     * @param callback    optional callback
     *
     * @return  undefined
     */
    drawScene: function panorama_drawScene(callback){

      // nothing to draw if sphere is not ready
      if (!this.sphere.geometryReady) {
        return;
      }

      var panorama=this;

      requestAnimationFrame(function(){
        panorama.renderFrame();
        if (callback) callback();
      });

    }, // panorama_drawscene

    /**
    * Panorama.renderFrame()
    *
    * Draw the panorama scene
    *
    * */
    renderFrame: function renderFrame() {
      var panorama=this;

      if (!panorama.sphere.geometryReady) {
        return;
      }

      // clamp latitude
      panorama.lat=Math.max(panorama.limits.lat.min,Math.min(panorama.limits.lat.max,panorama.lat));

      // update camera rotation
      panorama.theta=panorama.lon*Math.PI/180;
      panorama.phi=(90-panorama.lat)*Math.PI/180;

      // set camera lookAt vector
      panorama.lookAtVec=new THREE.Vector3(
        Math.sin(panorama.phi)*Math.cos(panorama.theta),
        Math.cos(panorama.phi),
        Math.sin(panorama.phi)*Math.sin(panorama.theta)
      );

      // adjust camera lookAt vector by inverse sphere rotation
      panorama.lookAtVec.applyMatrix4(new THREE.Matrix4().getInverse(panorama.sphere.object3D.matrix));

      // update camera orientation
      panorama.camera.instance.lookAt(panorama.lookAtVec);

      // allow subscribers to update objects before rendering
      panorama.dispatch('update');

      // clear framebuffer before rendering
      panorama.renderer.clear();

      // post-processing
      // @todo: move post-processing in a separate module
      if (panorama.postProcessing && panorama.postProcessing.enabled) {

        // render scene and apply post processing passes through composer
        panorama.composer.render(panorama.scene,panorama.camera.instance);

      } else {

        // render panorama scene
        panorama.renderer.render(panorama.scene,panorama.camera.instance);
      }

      // allow subscribers to render secondary scenes
      panorama.dispatch('render');

      // trigger inconditional or dynamic tiles loading/disposal
      panorama.sphere.updateTilesVisibilityStatus();
    },

    /* Panorama.onresize()
    * Panorama 'resize' event handler.
    *
    * Adjust camera, renderer and composer pass parameters for the new
    * canvas size.
    *
    * Update zoom and redraw scene.
    *
    * @param e  event object
    *
    * @return Boolean
    */
    onresize: function panorama_onresize(e){

      var panorama=this;

      var width=$(this.container).width();
      var height=$(this.container).height();

      // update camera projection matrix
      this.camera.instance.aspect=width/height;
      this.camera.instance.updateProjectionMatrix();

      // update renderer size
      this.renderer.setSize(width,height);

      if (this.postProcessing) {

        // update composer size
        this.composer.setSize(width,height);

        // update shader uniforms
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

        // sphere is not ready
        if (!panorama.sphere.geometryReady) {
          return;
        }

        // update fov/zoom and drawscene
        panorama.zoomUpdate();
        panorama.drawScene();

      },0);

    } // panorama_onresize

}); // Panorama Prototype

/*
 * jQuery panorama plugin
 *
 * @return jQuery object
 */
$.fn.panorama = function jQuery_panorama(options) {
    return this.each(function() {
        if ($(this).data('pano')) {
            // void
        } else {
            var panorama = new Panorama($.extend(true,{},options,{
                container: this
            }));
        }
    });
}; // jQuery_panorama

/**
 * isLeftButtonDown()
 * Detects if the left button is down from a mouse event.
 *
 * @return  Boolean     True if the left button is down, false otherwise.
 */
window.isLeftButtonDown=function isLeftButtonDown(e) {
     return ((e.buttons!==undefined && e.buttons==1) || (e.buttons===undefined && e.which==1));
 }, // isLeftButtonDown

/*
 * Panorama
 * Event Dispatcher
 */
setupEventDispatcher(Panorama.prototype);
setupEventDispatcher(Sphere.prototype);
setupEventDispatcher(TileSet.prototype);
setupEventDispatcher(Camera.prototype);
setupEventDispatcher(THREE.Mesh.prototype);
Panorama.prototype.dispatchEventsTo(Camera.prototype);
Sphere.prototype.dispatchEventsTo(Panorama.prototype);
THREE.Mesh.prototype.dispatchEventsTo(Sphere.prototype);
