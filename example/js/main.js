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

$(document).ready(function(){

  var filesToLoad=1;

  function file_onload() {
    --filesToLoad;
    if (!filesToLoad) {
      $(document).trigger('filesloaded');
    }
  }

  // load image with alpha channel to use as POI
  window.unicorn_texture=new THREE.ImageUtils.loadTexture(
    'img/unicorn.png',
    THREE.UVMapping,
    file_onload,
    function onloaderror() {
      $.notify('Cannot load unicorn.png !');
    }
  );

}); // ready

$(document).on('filesloaded', function(){

  window.eventDispatcherDebug=0;
  $('#pano').panorama({

/*
 * Properties and methods defined here will extend or override properties
 * and methods of the panorama object instance before the init() method is run
 *
 * When using panorama.list below to define several panoramas,
 * properties and methods defined there will extend or override properties
 * and methods of the panorama object instance.
 *
 */

/*
    // panorama.fov: camera field of view

    fov: {

      // initial field of view
      start: 120,

      // minimal field of view
      min: 1,

      // maximal field of view
      // fov > 120 results in non-rectilinear projection
      max: 120

    }, // fov

*/
    // panorama.rotation: panorama sphere rotation

    rotation: {

      // intial rotation matrix
      matrix: new THREE.Matrix4(),

      // vertical axis rotation (added to initial rotation matrix)
      heading: -90,

      // horizontal axis rotation (added to initial rotation matrix)
      // adjust in this example using <shift>-mousewheel
      tilt: 0,

      // depth axis rotation (added to initial rotation matrix)
      // adjust in this example using <alt>-mousewheel
      roll: 0,

      // rotation step for tilt and roll adjustment
      step: 0.1

    }, // rotation

/*
    // panorama.limits: limits

    limits: {

      // panorama vertical rotation limits
      lat: {
        min: -85,
        max: 85
      }

    }

*/
/*
    // panorama.camera: main camera options

    camera: {

      zoom: {

        // initial zoom value
        current: 1.0,

        // maximal zoom value
        max: 1.5

      }

    }, // camera

    // panorama.sphere: sphere object defaults
    // normally you dont need to modify this

*/
    sphere: {

      // load visible tiles first, then trigger other tiles loading
      dynamicTileInit: true,

      // load only visible tiles
      dynamicTileLoading: false,

      // dispose invisible tiles
      dynamicTileDisposal: false,


/*
      radius: 150,

      widthSegments: 36,

      heightSegments: 18,

      // panorama.sphere.texture: sphere texture options
      // When using 'panorama.list' to configure several panoramas,
      // 'panorama.list.defaults' will extend or override values below

      texture: {

        // tiles directory relative url
        dirName: 'panoramas/result_1403179805_224762-0-25-1/',

        // tile filename prefix
        baseName: 'result_1403179805_224762-0-25-1',

        // full panorama dimension, in tiles
        columns: 16,
        rows: 8

      } // texture
*/
    }, // sphere
/*
   // panorama.sound: sounds bound to panorama
   // When using 'panorama.list' below to configure several panoramas,
   // 'panorama.list.images[image].sound' properties and methods will
   // extend or modify values below

    sound: {

      // defaults for sounds defined in 'panorama.sound.list' below,
      // where more sound options are described

      defaults: {

        // sound type (only Howler is supported)
        type: 'howler',

        // event handlers
        onloaderror: function sound_onloaderror(sound_event) {
           console.log('sound_onloaderror: ',this,sound_event);
        },
        onload: null,
        onpause: null,
        onplay: null,
        onend: null

      },

      list: {

        // sound ID
        ambient1: {

          // Howler options
          src: ["ambient1.mp3"],
          autoplay: true,
          loop: true

        },

        ambient2: {
          src: ["welcome.mp3"]
          autoplay: true,
          loop: false
        }
      }

    },

    // panorama.poi: points of interest
    // When using panorama.list to define several panoramas,
    // poi options below are extended or overrided with the ones
    // from panorama.list.images[id].poi

    poi: {

      // use a secondary scene for rendering widgets (eg when using filters)
      overlay: false,

      // panorama.poi.defaults: default values for POIs
      defaults: {

          // set to false to disable mouse event handling
          handleMousevents: true,

          color: {
             active: '#0000ff',
             hover: '#ffffff',
             normal: '#000000'
          },

          // event handlers below are already filtered
          // eg: mousein and mouseout are not triggered during panorama rotation
          // if you really need, you can hook to the 'private' methods (eg: _mousein)

          onmousein: function poi_mousein(e) {
            console.log('mousein',this);
          },

          onmouseout: function poi_mouseout(e) {
            console.log('mouseout',this);
          },

          onmouseover: function poi_mouseover(e) {
          },

          onmousedown: function poi_mousedown(e) {
            console.log('mousedown',this);
          },

          onmouseup: function poi_mouseup(e) {
            console.log('mouseup',this);
          },

          onclick: function poi_click(e) {
            console.log('click',this);
          },
      },

      // panorama.poi.list
      list: {

        // POI identifier
        unicorn: {

          // to define the POI geometry you can either specify 'object'
          // as THREE.Object3D (default object is null)
          object: null,

          // ... or 'mesh' as THREE.mesh, (default mesh is a circle)
          mesh: new THREE.Mesh(new THREE.PlaneGeometry(Math.PI/4.5,Math.PI/4.5,1,1), new THREE.MeshBasicMaterial({
            map: unicorn_texture,
            transparent: true,
          })),

          // for POI defined as a texture with alpha layer like this one
          // setting 'handleTransparency' to true will disable mouse events
          // occuring over fully transparent pixels
          handleTransparency: true,

          // POI coordinates
          coords: {
            lon: -70,
            lat: 0
          }

        }, // unicorn

        // POI identifier
        circle: {

            // POI coords
            coords: {
              lon: -90,
              lat: 0
            },

            // poi.list.sound:
            // sounds bound to a poi
            sound: {

              // for defaults, see comments for panorama.sounds above
              defaults: {
              },

              // poi.list.sound.list
              list: {

                beep: {

                  // sound type specific options (see Howler.js 2.0 documentation)
                  src: ["sound/argo.mp3"],
                  autoplay: true,
                  loop: true,
                  fadeOut: 2000,

                  // If you specify optional WebAudio sound cone parameters,
                  // the sound is always oriented in the direction opposite
                  // to the camera, and the volume fall to coneOuterGain
                  // outside the cone outer angle.
                  coneInnerAngle: 30,
                  coneOuterAngle: 90,
                  coneOuterGain: 0,

                  // when specifying sound cone parameters above, set rolloffFactor
                  // to 0 will disable gain change relative to z position.
                  rolloffFactor: 0

                },
                plop: {
                  src: ["plop.mp3"]
                }
              }
            }
        } // circle
      } // poi.list
    }, // poi

    // work in progress
    hud: {
      list: {
        testarro: {
          color: {
            active: '#0000ff',
            normal: '#ffffff',
            hover: '#000000'
          },
          coords: {
            lon: 0,
            lat: 0
          }
        }
      }
    },

*/
    // when using jquery.freepano.list.js,
    // you can set the preferences for several images below
    // instead of sphere.texture above

    list: {

        // default options for elements of the 'images' object below
        // (will be merged with the sphere.texture properties above)

        defaults: {

          // tiles directory name
          dirName: 'panoramas/result_1403179805_224762-0-25-1',

          // tile filename prefix
          prefix: 'result_',

          // tile filename suffix
          suffix: '-0-25-1',

          // full panorama dimension, in tiles
          columns: 16,
          rows: 8,
          tileHeight: 512

        },

        // initial image
        // default is the first element of 'images' below
        initialImage: '1403179809_224762',

        // panorama list
        images: {
          // the panorama instance will be extended
          // 1. with the list.defaults above
          // 2. with the object below

          '1403179805_224762': {
            rotation: {
               tilt: 0
            },
            coords: {
              lon: 3.902137,
              lat: 43.600233,
            },

            /*
            sound: {
              list: {
                1: {
                  src: ["ambiance1.mp3"]
                },
                2: {
                  src: ["ambiance2.mp3"]
                }
              }
            },
            */
            poi: {
              defaults: {
                color: {
                    normal: 'blue',
                    selected: 'blue',
                    hover: 'white',
                    active: 'brown'
                }
              },
              list: {
                circle: {
                    size: 5,
                    color: {
                        normal: 'lightgreen',
                        selected: 'lightgreen',
                        hover: 'yellow',
                        active: 'red'
                    },
                    coords: {
                      lon: 0,
                      lat: 0
                    },
                    sound: {
                      list: {
                        beep: {
                          src: ["sound/argo.mp3"],
                          autoplay: true,
                          loop: true,
                          fadeOut: 2000,
                          coneInnerAngle: 30,
                          coneOuterAngle: 90,
                          coneOuterGain: 0,
                          rolloffFactor: 0
                        },
                        /*
                        plop: {
                          src: ["plop.mp3"]
                        }
                        */
                      }
                    }
                }, // circle
                square: {
                    mesh: function square_mesh() {
                        var poi = this;
                        return new THREE.Mesh(new THREE.PlaneBufferGeometry(poi.size,poi.size,1,1), new THREE.MeshBasicMaterial({
                            transparent: true,
                            opacity: 0.3,
                            depthWrite: false,
                            depthTest: false
                        }));
                    },
                    coords: {
                      lon: 10,
                      lat: 0
                    }
                }, // square
                triangle: {
                    mesh: function triangle_mesh() {
                        var poi=this;
                        var geometry=new THREE.Geometry();
                        var s=poi.size/1.75;
                        geometry.vertices.push(new THREE.Vector3(-s,-s,0));
                        geometry.vertices.push(new THREE.Vector3(s,-s,0));
                        geometry.vertices.push(new THREE.Vector3(0,s,0));
                        geometry.faces.push(new THREE.Face3(0,1,2));
                        return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
                            transparent: true,
                            opacity: 0.3,
                            depthWrite: false,
                            depthTest: false
                        }));
                    },
                    coords: {
                      lon: 20,
                      lat: 0
                    }
                }, // triangle

                unicorn: {

                    mesh: function unicorn_mesh() {
                        var poi=this;
                        return new THREE.Mesh(new THREE.PlaneBufferGeometry(poi.size,poi.size,1,1), new THREE.MeshBasicMaterial({
                            map: unicorn_texture,
                            transparent: true,
                            opacity: 0.3,
                            depthWrite: false,
                            depthTest: false
                        }));
                    },

                  handleTransparency: true,

                  coords: {
                    lon: 30,
                    lat: 0
                  }

                } // unicorn
              } // list
            }, // poi

            arrow: {
              list: {
                0: {
                  coords: {
                    lon: 0,
                    lat: -5
                  },
                  target: '1403179809_224762'
                }
              }
            }

          },

          // second image
          '1403179809_224762': {
            dirName: 'panoramas/result_1403179809_224762-0-25-1',
            coords: {
              lon: 3.901933,
              lat: 43.600545,
            },
            arrow: {
              list: {
                0: {
                  coords: {
                    lon: -182,
                    lat: -7
                  },
                  target: '1403179805_224762'
                }
              }
            }
          }
        }
    },

    controls: {
        touch: {
            move: {
                active: true
            },
            zoom: {
                active: true
            }
        },
        keyboard: {
            move: {
                active: true
            },
            zoom: {
                active: true
            }
        },
        devicemotion: {
            move: {
                active: false,
                remote: false
            }
        }
    },

    map: {
        active: true
    },

    example: {
        active: true
    },

    // THREE.js renderer options

    renderer: {

      precision: 'highp',

      antialias: false,

      alpha: false

    },


/* incompatible with panorama.list below yet
    pyramid: {
      dirName: 'panoramas/result_1403179805_224762-0-25-1/512',
      baseName: 'result_1403179805_224762-0-25-1',
      levels: 4,
      preload: true
      sphere: [
        {
          radius: 1
        },
        {
          radius: 2
        },
        {
          radius: 4
        },
        {
          radius: 8
        },
        {
          radius: 16
        },
      ]
    },
*/

    postProcessing: {
      enabled: false,

      green: {
        shader: THREE.GreenShader,
        enabled: false,
        uniforms: {}
      },

      edge: {
        shader: THREE.EdgeShader,
        enabled: false,
        uniforms: {
          aspect: function(panorama) {
            this.value.x=$(panorama.container).width();
            this.value.y=$(panorama.container).height();
          }
        }
      },

      edge2: {
        shader: THREE.EdgeShader2,
        enabled: false,
        uniforms: {
          aspect: function(panorama) {
            this.value.x=$(panorama.container).width();
            this.value.y=$(panorama.container).height();
          }
        }
      }
    }

  }); // panorama


  window.p=window.panorama=$('#pano').data('pano');

  panorama.dispatchEventsTo({

    on_panorama_ready: function(e){
      video_init(this);
      setInterval(function(){
          panorama.drawScene();
      },1000/window.video.fps);
    },

    on_panorama_render: function(e) {
      var panorama=this;
      var video=window.video;

      video_updateGeometry();

      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        if (
            videoImageContext.lastUpdate == undefined ||
            Math.abs(video.currentTime - videoImageContext.lastUpdate) > 1/video.fps
        ) {
          if (video.texture) {
            videoImageContext.lastUpdate=video.currentTime;
            videoImageContext.drawImage(video,0,0);
            video.texture.needsUpdate=true;
          }
        }

        // render video mask
        panorama.renderer.render(video.mask.scene,panorama.camera.instance,video.mask.renderTarget,true);

        // map video
        panorama.renderer.render(video.scene,video.camera);

      }
    } // on_panorama_render
  });


  /**
  * video_init
  */
  function video_init(panorama){

      var video=window.video;

      if (!video) {
          video=window.video=document.createElement('video');
          video.width=640;
          video.height=360;
          video.autoplay=true;
          video.loop=true;
          video.src='video.mp4';
          video.fps=23.98;
      }

      var videoImage=video.image;

      if (!videoImage) {
          videoImage=video.image=document.createElement('canvas');
          videoImage.width=video.width;
          videoImage.height=video.height;
          videoImageContext=videoImage.getContext('2d');
          videoImageContext.fillStyle = '#000000';
          videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height );
      }

      var texture=video.texture;

      if (!texture) {
          texture=video.texture=new THREE.Texture(videoImage);
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.format = THREE.RGBFormat;
      }

      var canvas=panorama.renderer.getContext().canvas;

      var mask=video.mask;

      if (!mask) {

         mask=video.mask={

             scene: new THREE.Scene(),

             renderTarget: new THREE.WebGLRenderTarget(canvas.width, canvas.height, {
                  minFilter:THREE.LinearFilter,
                  stencilBuffer:false,
                  depthBuffer:false
              }),

              geometry: new THREE.PlaneGeometry(video.width,video.height,1,1),

              // mask material
              material: new THREE.MeshBasicMaterial({
                color: new THREE.Vector3(1.0,1.0,1.0,1.0),
                depthWrite: false,
                depthTest: false
              }),

              /**
              * video_mask_init()
              */
              init: function video_mask_init() {
                 var mask=this;

                 mask.geometry.dynamic=true;


                 mask.mesh=new THREE.Mesh(mask.geometry, mask.material);
                 mask.mesh.name="video_mask";
                 mask.mesh.rotateY(Math.PI/2);

                 mask.scene.add(mask.mesh);


              }
          }

          mask.init();
      }

      if (!video.H) {
          video.H=new THREE.Matrix3();
      }

      var shaderMaterial=video.shaderMaterial;

      if (!shaderMaterial) {

          var shaderMaterial=video.shaderMaterial=new THREE.ShaderMaterial({
            transparent: true,
            uniforms: {
                video1_texture: {type: 't', value: video.texture},
                mask: {type: 't', value: video.mask.renderTarget},
                video1_H: {type: 'm3', value: video.H}
            },
            vertexShader: [
              'varying vec2 vUv;',
              'void main() {',
              '  vUv = uv;',
              '  gl_Position =   projectionMatrix * modelViewMatrix * vec4(position,1.0);',
              '}'
            ].join("\n"),
            fragmentShader: [
              'varying vec2 vUv;',
              'uniform sampler2D video1_texture;',
              'uniform sampler2D mask;',
              'uniform mat3 video1_H;',
              'void main() {',
              '  vec4 maskColor=texture2D(mask,vUv);',
              '  vec3 src=vec3(gl_FragCoord.x,gl_FragCoord.y,1)*video1_H;',
              '  vec4 vidColor=texture2D(video1_texture,vec2(src.x/src.z,1.0-src.y/src.z));',
              '  gl_FragColor = vec4(vidColor.x,vidColor.y,vidColor.z,vidColor.w*maskColor.x);',
              '}'
            ].join("\n"),


        });
      }

      var mesh=video.mesh;

      if (!mesh) {
          mesh=video.mesh=new THREE.Mesh( new THREE.PlaneGeometry(canvas.width,canvas.height,1,1) , video.shaderMaterial );
          mesh.name="video";

          video.scene=new THREE.Scene();
          video.scene.add(mesh);

          video.camera=new THREE.OrthographicCamera(canvas.width/-2, canvas.width/2, canvas.height/2, canvas.height/-2, -10000, 10000 );

      }



///////////////////////////

  }

  /**
  * video_updateGeometry()
  */
  function video_updateGeometry() {
      var video=window.video;
      if (!video) return;

      // indexes
      var topLeft=0;
      var topRight=1;
      var botLeft=2;
      var botRight=3;

      // image corners in radians
      var corner=window.corner||[
          /* topLeft */  {x: 3631/8192*Math.PI*2, y: 2325/4096*Math.PI},
          /* topRight */ {x: 4282/8192*Math.PI*2, y: 2353/4096*Math.PI},
          /* botLeft */  {x: 3503/8192*Math.PI*2, y: 2404/4096*Math.PI},
          /* botRight */ {x: 4358/8192*Math.PI*2, y: 2452/4096*Math.PI}

      ];

      window.corner=corner;

      var geometry=video.mask.geometry;


      var depth=1;

      var cameraAxis = new THREE.Vector3(
        depth*Math.sin(panorama.phi)*Math.cos(panorama.theta),
        depth*Math.cos(panorama.phi),
        depth*Math.sin(panorama.phi)*Math.sin(panorama.theta)
      );

      var worldToScreen=new THREE.Matrix4().multiplyMatrices(panorama.camera.instance.projectionMatrix,panorama.camera.instance.matrixWorldInverse);
      var canvas=panorama.renderer.getContext().canvas;

      // for each image corner (in spherical coordinates)
      $.each(corner,function(i,corner) {

         // convert to cartesian coordinates
         var phi=-corner.y;
         var theta=corner.x;
         var v=new THREE.Vector3(
             depth*Math.sin(phi)*Math.cos(theta),
             depth*Math.cos(phi),
             depth*Math.sin(phi)*Math.sin(theta)

         );

         // project at equidistance along the camera axis
         f=v.dot(cameraAxis);
         if (f>0) {
             v.multiplyScalar(1/f);
          } else {
            // behind ?
          }
         geometry.vertices[i]=v;

         // compute screen coordinates
         var pos=video.mask.mesh.localToWorld(v.clone());
         pos.applyMatrix4(worldToScreen);
         var screenPos=v.screenPos={
              x: (pos.x+1)*canvas.width/2,
              y: (pos.y+1)*canvas.height/2
         }
         console.log(screenPos);
      });

      var v=geometry.vertices;
      video.H.fromArray(getPerspectiveTransform([
        v[0].screenPos,
        v[1].screenPos,
        v[3].screenPos,
        v[2].screenPos
      ])[1]);

        geometry.verticesNeedUpdate=true;

  }

  function getPerspectiveTransform(P) {

        var H=[];

        var sx = (P[0].x-P[1].x)+(P[2].x-P[3].x);
        var sy = (P[0].y-P[1].y)+(P[2].y-P[3].y);
        var dx1 = P[1].x-P[2].x;
        var dx2 = P[3].x-P[2].x;
        var dy1 = P[1].y-P[2].y;
        var dy2 = P[3].y-P[2].y;

        var z = (dx1*dy2)-(dy1*dx2);
        var g = ((sx*dy2)-(sy*dx2))/z;
        var h = ((sy*dx1)-(sx*dy1))/z;

        // projection matrix
        var a=H[0]=P[1].x-P[0].x+g*P[1].x;
        var b=H[1]=P[3].x-P[0].x+h*P[3].x;
        var c=H[2]=P[0].x;
        var d=H[3]=P[1].y-P[0].y+g*P[1].y;
        var e=H[4]=P[3].y-P[0].y+h*P[3].y;
        var f=H[5]=P[0].y;
        H[6]=g;
        H[7]=h;
        H[8]=1;

	// inverse projection matrix (adjoint matrix)
	    var adj=[];
        adj[0]=e-f*h;
        adj[1]=c*h-b;
        adj[2]=b*f-c*e;
        adj[3]=f*g-d;
        adj[4]=a-c*g;
        adj[5]=c*d-a*f;
        adj[6]=d*h-e*g;
        adj[7]=b*g-a*h;
        adj[8]=a*e-b*d;

        return [H,adj]

  }

  $(document).on('keydown',function(e){
    switch(e.keyCode) {
    case 32: // space
      console.log('lon ['+panorama.lon+'] lat ['+panorama.lat+'] tilt ['+panorama.rotation.tilt+'] roll ['+panorama.rotation.roll+']');
      var cornerIndex=window.cornerIndex||0;
      var pos=panorama.mouseCoords;
      console.log(pos)
      corner[cornerIndex].x=pos.pixel_x/8192*Math.PI*2;
      corner[cornerIndex].y=pos.pixel_y/4096*Math.PI;
      ++cornerIndex;
      console.log(cornerIndex)
      if (cornerIndex==4)  {
        cornerIndex=0;
      }
      window.cornerIndex=cornerIndex;
      break;
    case 49: // 1
      toggleEffect(panorama.postProcessing.edge);
      break;
    case 50: // 2
      toggleEffect(panorama.postProcessing.edge2);
      break;
    case 51: // 3
      toggleEffect(panorama.postProcessing.green);
      break;
    case 77: // m
      var map = panorama.map;
      if(map) {
          map.instance.active = !map.instance.active;
      }
      break;
    case 27: // esc
      if (panorama.ias) {
        panorama.snapshot.toggleEdit({
          keepThumb:false
        });
      } else if ($(panorama.gallery.overlay).is(':visible')) {
          panorama.gallery.hide();
      }
      break;
    case 13: // enter
      if (panorama.ias) {
        panorama.snapshot.toggleEdit({
          save: true,
          keepThumb: true
        });
      }
      break;
    case 80: // p
      panorama.snapshot.toggleEdit({
        cancel: true,
        keepThumb: false,
      });
      break;
    }

    if (panorama.postProcessing) panorama.postProcessing.enabled=panorama.postProcessing.edge.pass.enabled||panorama.postProcessing.edge2.pass.enabled||panorama.postProcessing.green.pass.enabled;

  }); // keydown


  // apply clicked snapshot image filter parameters to current selection
  $('#snapshot_bar').on('click','canvas',function(e){
    if (!panorama.ias || panorama.ias.getSelection().width==0 || panorama.ias.getSelection().height==0) {
      if (panorama.ias) {
        panorama.snapshot.toggleEdit({
          cancel: true,
          keepThumb: false,
        });
      }
      panorama.gallery.show(e.target);
      return;
    }
    var filters=$(e.target).parent().data('filters');
    $.each(filters.widget,function(){
      var widget=this;
      $('#imagefilters .filter.'+widget.imageFilter.filter+' '+'.parameter.'+widget.name+' input').val(widget.value).change();
//      widget.imageFilter.processFilters();
    });
    panorama.snapshot._imageFilter.processFilters();

  });

  function toggleEffect(effect){
    effect.pass.enabled=!effect.pass.enabled;
    panorama.drawScene();
  }

}); // filesloaded


function isPointInClockwiseTriangle(p, p0, p1, p2) {
    var s = (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * p.x + (p0.x - p2.x) * p.y);
    var t = (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * p.x + (p1.x - p0.x) * p.y);

    if (s <= 0 || t <= 0)
        return false;

    var A = (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);

    return (s + t) < A;
}
