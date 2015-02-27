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


var Xaxis=new THREE.Vector3(1,0,0);
var Yaxis=new THREE.Vector3(0,1,0);
var Zaxis=new THREE.Vector3(0,0,1);

// return THREE.Vector3 from lon/lat in radians
function getVector3FromAngles(lon,lat) {
  var v=new THREE.Vector3(0,0,-1);
  v.applyAxisAngle(Xaxis,lat);
  v.applyAxisAngle(Yaxis,lon);
  return v;
}


/*
 * Texture
 * Class Constructor
 */
function Texture(options) {

    if (!(this instanceof Texture))
        return new Texture(options);

    $.extend(true,this,this.defaults,options);
    this.init();

} // Texture Constructor

/*
 * Texture
 * Class Prototype
 */
$.extend(true,Texture.prototype,{

    defaults: {
        dirName: null,
        baseName: null,
        options: {
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
     * init()
     * Initializes Texture properties.
     *
     * @return  void
     */
    init: function texture_init() {

        // default material
        this.defaultMaterial = new THREE.MeshBasicMaterial({
            wireframe: false,
            color: 0x000000,
            needsUpdate: true
        });

    }, // texture_init

    /**
     * getTileName()
     * Returns the texture tile path based on its column, row and base name.
     *
     * @return  String      Texture tile path.
     */
    getTileName: function texture_getTileName(col,row) {
        return this.dirName+'/'+this.baseName+'_'+row+'_'+col+'.jpg';
    } // texture_getTileName

}); // Texture Prototype


/*
 * Sphere
 * Class Constructor
 */
function Sphere(options) {

    if (!(this instanceof Sphere))
        return new Sphere(options);

    $.extend(true,this,this.defaults,options);
    this.init();

} // Sphere Constructor

/*
 * Sphere
 * Class Prototype
 */
$.extend(true,Sphere.prototype,{

    defaults: {
        done: false,
        radius: 150,
        widthSegments: 16,
        heightSegments: 8,
        texture: null,
        object3D: null,
        callback: function(){}
    }, // defaults

    /**
     * init()
     * Initializes Sphere properties.
     *
     * @return  void
     */
    init: function sphere_init(callback) {

        var sphere = this;

        // texture
        if (sphere.texture !== undefined) {
            if (!(sphere.texture instanceof Texture)) {
                sphere.texture = new Texture(sphere.texture);
                sphere.done = false;
            }
        }

        // object3d
        // sphere partial meshes will be grouped in it
        sphere.object3D = new THREE.Object3D();

        // build the sphere
        sphere.build(callback);

    }, // sphere_init

    /**
     * build()
     * Builds the sphere object with partial meshes and default material.
     *
     * @return  void
     */
    build: function sphere_build(callback) {

        var sphere = this;

        // tiles
        var columns = sphere.texture.columns;
        var rows = sphere.texture.rows;

        // sphere segments angular size
        var phiLength = 2*Math.PI/columns;
        var thetaLength = Math.PI/rows;

        // sphere texture height
        sphere.texture.height = rows*sphere.texture.tileHeight;

        // sphere radius
        sphere.r = sphere.texture.height/Math.PI;

        // transformation matrix (inversion)
        var transform = new THREE.Matrix4().makeScale(-1,1,1);

        // loop over columns and rows
        for(var col=0; col<columns; ++col) {
            for(var row=0; row<rows; ++row) {

                // build partial geometry
                var geometry = new THREE.SphereGeometry(sphere.radius,sphere.widthSegments,sphere.heightSegments,col*phiLength,phiLength,row*thetaLength,thetaLength);

                // apply transformation matrix
                geometry.applyMatrix(transform);

                // mesh with partial geometry and default material
                var mesh = new THREE.Mesh(geometry,sphere.texture.defaultMaterial);

                // mesh properties
                $.extend(true,mesh, {
                    col: col,
                    row: row,
                    shown: false,
                    dispose: false
                });

                // add mesh in object
                sphere.object3D.add(mesh);

            }
        }

        // sphere built
        // dispatch event and start tiling
        setTimeout(function(){

            // mark sphere as done/builded
            sphere.done = true;

            // dispatch ready event
            sphere.dispatch('ready');

            // frustum based tiling
            setTimeout(function() {
                sphere.updateFrustumTiling();
            },0);

        },0);

    }, // sphere_build

    /**
     * updateFrustumTiling()
     * Tiling management, displays (or dispose) tiles depending of the camera frustum.
     *
     * @return  void
     */
    updateFrustumTiling: function sphere_updateFrustumTiling() {

        var sphere = this;

        // update camera frustum
        sphere.panorama.camera.updateFrustum();

        // loop over each mesh of the sphere
        $.each(sphere.object3D.children, function() {

            var mesh = this;

            // visible
            // load tile if not already shown, do nothing otherwise
            if (sphere.panorama.camera.frustum.intersectsObject(mesh)) {

                // already shown
                if (mesh.shown)
                    return;

                // set as show
                mesh.shown = true;

                // load tile
                var material = new THREE.MeshBasicMaterial({
                    map: sphere.loadTile(mesh.col,mesh.row),
                    depthTest: false,
                    depthWrite: false
                });

                // set material
                mesh.material = material;
                mesh.material.needsUpdate = true;

            // not visible
            // dispose tile if shown, do nothing otherwise
            } else {

                // set as not shown
                mesh.shown = false;

                // dispose texture/material to free memory
                if (mesh.dispose && mesh.material && mesh.material.map) {

                    // dispose tile
                    mesh.material.map.dispose();
                    mesh.material.dispose();

                    // default material
                    mesh.material = sphere.texture.defaultMaterial;

                }
            }

        });

    }, // sphere_updateFrustumTiling

    /**
     * loadTile()
     * Loads a tile image.
     *
     * @return  Texture     Loaded texture as a Texture object.
     */
    loadTile: function sphere_loadTile(col,row,callback) {

        var sphere = this;

        // load the texture
        var tileTexture = THREE.ImageUtils.loadTexture(sphere.texture.getTileName(col,row),THREE.UVMapping,
            // success
            function loadTexture_onload(texture) {
                // panorama redraw
                setTimeout(function(){
                    sphere.panorama.drawScene.call(sphere.panorama);
                },0);
            },
            // error
            function loadTexture_onerror() {
                $.notify('Cannot load panorama tiles.');
            }
        );

        // texture properties
        $.extend(tileTexture,sphere.texture.options);

        return tileTexture;

    }, // sphere_loadTile

    /**
     * updateTexture()
     * Asks the sphere to reload the texture object as it has changed.
     *
     * @return  void
     */
    updateTexture: function sphere_updateTexture(callback) {

        var sphere = this;

        // set all mesh as not shown
        // this will cause the tiles to be reloaded
        $.each(sphere.object3D.children, function() {
            this.shown = false;
        });

        // frustum based tiling
        sphere.updateFrustumTiling();

        // dispatch ready event
        sphere.dispatch('ready');

    } // sphere_updateTexture

}); // Sphere Prototype


/*
 * Camera
 * Class Constructor
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
    }, // Camera defaults

    /**
     * init()
     * Initializes Camera properties.
     *
     * @return  void
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

        // camera look at initial position
        camera.target = new THREE.Vector3(0,0,0);

    }, // camera_init

    /**
     * updateFrustum()
     * Updates the frustum object based on camera projection matrix.
     *
     * @return  void
     */
    updateFrustum: function camera_updateFrustum() {

        var camera = this;

        // camera.instance.updateMatrixWorld();
        // camera.instance.matrixWorldInverse.getInverse(camera.instance.matrixWorld);

        // camera projection matrix
        camera.viewProjectionMatrix.multiplyMatrices(camera.instance.projectionMatrix,camera.instance.matrixWorldInverse);

        // set frustum from camera projection matrix
        camera.frustum.setFromMatrix(camera.viewProjectionMatrix);

    }, // camera_updateFrustum

    /**
     * on_panorama_resize()
     * Event triggered on panorama resize. Updates the frustrum object.
     *
     * @return  void
     */
    on_panorama_resize: function camera_on_panorama_resize(e) {
        this.camera.updateFrustum();
    }, // camera_on_panorama_resize

    /**
     * on_panorama_zoom()
     * Event triggered on panorama zoom. Updates the frustrum object.
     *
     * @return  void
     */
    on_panorama_zoom: function camera_on_panorama_zoom(e) {
        this.camera.updateFrustum();
    } // camera_on_panorama_zoom

}); // Camera Prototype


/*
 * Panorama
 * Class Constructor
 */
function Panorama(options) {

    if (!(this instanceof Panorama))
        return new Panorama(options);

    // globalize
    window.p = this;

    $.extend(true,this,this.defaults,options);
    this.init();

} // Panorama Constructor

/*
 * Panorama
 * Class Prototype
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
      }
    }, // defaults

    /**
     * init()
     * Initializes Panorama properties, including Scene, Camera, Sphere, WebGL
     * renderer and Effects/Shaders.
     *
     * @return  void
     */
    init: function panorama_init() {

        var panorama = this;
        $(panorama.container).data('pano',panorama);

        // scene
        panorama.scene = new THREE.Scene();

        // dispatch preinit event
        panorama.dispatch('preinit');

        // camera
        if (!(panorama.camera instanceof Camera)) {
            panorama.camera = new Camera($.extend(true,{
                panorama: panorama,
                fov: panorama.fov.start
            },panorama.camera));
        }

        // sphere
        if (panorama.sphere !== undefined) {

            // instance
            if (!(panorama.sphere instanceof Sphere)) {
                panorama.sphere = new Sphere($.extend(true,{
                    panorama: panorama,
                    onready: function(){
                        panorama.updateRotationMatrix();
                        panorama.dispatch('resize');
                        panorama.dispatch('ready');
                    }
                },panorama.sphere));
            }

            // add sphere to panorama
            panorama.scene.add(panorama.sphere.object3D);

        }

        // renderer
        if (!(panorama.renderer instanceof THREE.WebGLRenderer)) {

            // webgl renderer
            try {
                panorama.renderer = $.extend(new THREE.WebGLRenderer(panorama.renderer.parameters),panorama.renderer.properties);
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

        // post-processing
        // @todo: move post-processing in a separate module
        if (panorama.postProcessing) {

            // effect composer
            panorama.composer = new THREE.EffectComposer(panorama.renderer);

            // add render pass
            panorama.composer.addPass(new THREE.RenderPass(panorama.scene,panorama.camera.instance));

            // add shader passes
            $.each(panorama.postProcessing,function() {

                if (this instanceof Boolean)
                    return true;

                // shader pass
                this.pass = new THREE.ShaderPass(this.shader);
                this.pass.enabled = this.enabled;

                // uniforms calls
                var pass = this.pass;
                $.each(this.uniforms,function(uniform,_set) {
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

        // init panorama events
        panorama.eventsInit();

        // dispatch init event
        panorama.dispatch('init');

    }, // panorama_init

    /**
     * eventsInit()
     * Initializes Panorama events.
     *
     * @return  void
     */
    eventsInit: function panorama_eventsInit() {

        var panorama = this;

        // renderer canvas
        var canvas=$('canvas:first',this.container);

        // container events
        $(this.container)
            .off('.panorama'+this.num)
            .on('mousedown.panorama'+this.num, canvas, function(e) {
                e.target = panorama;panorama.dispatch(e);
            })
            .on('mousemove.panorama'+this.num, canvas, function(e) {
                e.target=panorama;panorama.dispatch(e);
            })
            .on('mouseup.panorama'+this.num, canvas, function(e) {
                e.target=panorama;panorama.dispatch(e);
            })
            .on('mousewheel.panorama'+this.num, canvas, function(e) {
                e.target=panorama;panorama.dispatch(e);
            })
            .on('zoom.panorama'+this.num, canvas, function(e) {
                e.target=panorama;panorama.dispatch(e);
            });

        // window resize
        $(window).on('resize.panorama'+this.num, function(e) {
            e.target=panorama;panorama.dispatch(e);
        });

    }, // panorama_eventsInit

    /**
     * updateRotationMatrix()
     * Updates the sphere rotation matrix based on X,Y,Z axis. This method must
     * be called after changing the panorama rotation values.
     *
     * @return  void
     */
    updateRotationMatrix: function panorama_updateRotationMatrix() {

        var panorama = this;

        // panorama initial rotation
        var R = panorama.initialRotation.clone();

        // combine with rotation angles
        R.multiply((new THREE.Matrix4()).makeRotationAxis(Xaxis,THREE.Math.degToRad(panorama.rotation.tilt)));
        R.multiply((new THREE.Matrix4()).makeRotationAxis(Yaxis,THREE.Math.degToRad(panorama.rotation.heading)));
        R.multiply((new THREE.Matrix4()).makeRotationAxis(Zaxis,THREE.Math.degToRad(panorama.rotation.roll)));

        // set sphere rotation from computed matrix
        panorama.sphere.object3D.rotation.setFromRotationMatrix(R);

    }, // panorama_updateRotationMatrix

    /**
     * getTextureCoordinates()
     * Returns the top/left coordinates on the texture based on latitude/longitude.
     *
     * @return  Object      Top and left coordinates as an Object.
     */
    getTextureCoordinates: function panorama_getTextureCoordinates(lon,lat) {

        var panorama = this;

        // step
        var step = panorama.sphere.texture.height/180;

        // normalize longitude
        lon = (lon-180) % 360;
        if (lon < 0)
            lon += 360;

        // top/left
        return {
            top: panorama.sphere.texture.height-(step*(lat+90)),
            left: step*lon
        };

    }, // panorama_getTextureCoordinates

    /**
     * getMouseCoords()
     * Returns the latitude/longitude coordinates relative to the mouse pointer.
     * This method also sets the mouse coordinates xyz/phi/theta vector and
     * computed the vertical/horizontal FOV.
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

        // texture size
        var texture_w = panorama.sphere.texture.height * 2;
        var texture_h = panorama.sphere.texture.height;

        // set mouse coordinates accordingly
        var m = panorama.mouseCoords;
        m.set(posf[0]*panorama.sphere.radius,posf[1]*panorama.sphere.radius,posf[2]*panorama.sphere.radius);

        // set mouse ellipsoidal coordinates
        m.phi = phi;
        m.theta = lam;

        // set mouse pixel coordinates
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
        // panorama.showMouseDebugInfo(m);

        return {
            lon: cursor.lon,
            lat: cursor.lat
        };

    }, // panorama_getMouseCoords

    /**
     * showMouseDebugInfo()
     * Displays mouse information upon the renderer. Debug purposes only.
     *
     * @return  void
     */
    showMouseDebugInfo: function panorama_showMouseDebugInfo(vector){

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
                        + 'x: ' + vector.x.toPrecision(6) + '<br />'
                        + 'y: ' + vector.y.toPrecision(6) + '<br />'
                        + 'z: ' + vector.z.toPrecision(6) + '<br />'
                        + 'lon: ' + vector.lon.toPrecision(6) + '<br />'
                        + 'lat: ' + vector.lat.toPrecision(6) + '<br />'
                        + 'pix x: ' + vector.pixel_x.toPrecision(6) + '<br />'
                        + 'pix y: ' + vector.pixel_y.toPrecision(6) + '<br />'
                    + '</div>';

        // display
        div.html(html);

    }, // panorama_showMouseDebugInfo

    /**
     * textureToWorldCoords() -- unused
     * ...
     *
     * @return  ...
     */
    /*
    textureToWorldCoords: function panorama_textureToWorldCoords(x,y) {

        var panorama = this;

        var step = panorama.sphere.texture.height/180;
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
        // panorama.showMouseDebugInfo(info);

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
        // panorama.showMouseDebugInfo(m);

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













    onmousedown: function panorama_mousedown(e){
      if (isLeftButtonDown(e)) {
        this.mode.leftButtonDown=true;
        this.mode.mayrotate=true;
        e.preventDefault();
        //console.log(this.lon,this.lat);
        this.mousedownPos={
          lon: this.lon,
          lat: this.lat,
          cursorCoords: this.getMouseCoords(e),
          textureCoords: this.getTextureCoordinates(this.mouseCoords.lon,this.mouseCoords.lat)
        };
      } else {
        this.mode.leftButtonDown=false;
      }
    },

    onmousemove: function panorama_mousemove(e){
      if (!this.sphere.done) {
        return;
      }

      if (e.done) {
        console.log('fixme');
        return;
      }
      e.done=true;

      if (isLeftButtonDown(e)) {
        if (this.mode.mayrotate) {
          this.mode.mayrotate=false;
          this.mode.rotate=true;
        }
        if (this.mode.rotate) {
          e.preventDefault();
          var cursorCoords=this.getMouseCoords(e);
          this.lon=(this.mousedownPos.lon-(cursorCoords.lon-this.mousedownPos.cursorCoords.lon))%360;
          this.lat=this.mousedownPos.lat+(cursorCoords.lat-this.mousedownPos.cursorCoords.lat);
          if (this.lon<0) this.lon+=360;
          //console.log(this.lon,this.lat);
          this.dispatch('rotate');
          this.drawScene();
        }
      } else {
        this.mode.mayrotate=false;
        this.mode.rotate=false;
        this.mode.leftButtonDown=false;
      }
      return false;
    },


    onmouseup: function panorama_mouseup(e){

      var leftButtonUp=this.mode.leftButtonDown;
      var rotating=this.mode.rotate;

      this.mode.rotate=false;
      this.mode.mayrotate=false;
      this.mode.leftButtonDown=false;

      // dont dispatch click after rotation
      // nor after single mouseup

      if (!rotating && leftButtonUp) {
        e.type='click';
        this.dispatch(e);
      }

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
        this.dispatch('zoom');
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
      if (this.camera.zoom.current<0) this.camera.zoom.current=0;
      this.zoomUpdate();
    },

    drawScene: function panorama_drawScene(callback){
      if (!this.sphere.done) {
        return;
      }
      var panorama=this;
      panorama.sphere.updateFrustumTiling();
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

      panorama.camera.instance.lookAt(panorama.lookAtVec);

      panorama.dispatch('update');

      panorama.renderer.clear();
      // TODO move post-Processing to jquery.freepano.postprocessing.js
      if (panorama.postProcessing && panorama.postProcessing.enabled) {
        // render scene with postProcessing filters
        panorama.composer.render(panorama.scene,panorama.camera.instance);
      } else {
        // render scene
        panorama.renderer.render(panorama.scene,panorama.camera.instance);
      }

      panorama.dispatch('render');
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

}); // Panorama Prototype


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

setupEventDispatcher(Panorama.prototype);
setupEventDispatcher(Sphere.prototype);
setupEventDispatcher(Camera.prototype);
Panorama.prototype.dispatchEventsTo(Camera.prototype);
