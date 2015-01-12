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
    new THREE.UVMapping(),
    file_onload,
    function onloaderror() {
      $.notify('Cannot load unicorn.png !');
    }
  );

}); // ready

$(document).on('filesloaded', function(){

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
    // panorama.rotation: initial panorama sphere rotation

    rotation: {

      // vertical axis rotation
      heading: -90,

      // horizontal axis rotation
      // adjust in the viewer using <shift>-mousewheel
      tilt: 0,

      // depth axis rotation
      // adjust in the viewer using <alt>-mousewheel
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

    sphere: {

      radius: 15,

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
          mesh: new THREE.Mesh(new THREE.PlaneGeometry(Math.PI/18,Math.PI/18,1,1), new THREE.MeshBasicMaterial({
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
          rows: 8

        },

        // initial image
        // default is the first element of 'images' below
//      initialImage: '1403179809_224762',

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
                  active: '#0000ff',
                  hover: '#ffffff',
                  normal: '#000000'
                }
              },
              list: {
                circle: {
                    coords: {
                      lon: -90,
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
                    mesh: new THREE.Mesh(new THREE.PlaneGeometry(Math.PI/18,Math.PI/18,1,1), new THREE.MeshBasicMaterial({
                      color: 0x000000,
                      transparent: true,
                      opacity: 0.3
                    })),
                    coords: {
                      lon: -70,
                      lat: 0
                    }
                }, // square
                triangle: {
                    mesh: function test2_mesh() {
                      var poi=this;
                      var geometry=new THREE.Geometry();
                      var s=poi.size;
                      geometry.vertices.push(new THREE.Vector3(-s,-s,0));
                      geometry.vertices.push(new THREE.Vector3(s,-s,0));
                      geometry.vertices.push(new THREE.Vector3(0,s,0));
                      geometry.faces.push(new THREE.Face3(0,1,2));
                      return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
                        color: 0x000000,
                        transparent: true,
                        opacity: 0.3
                      }));
                    },
                    coords: {
                      lon: -80,
                      lat: 0
                    }
                }, // triangle
                
                unicorn: {

                  color: {
                    active: 'purple',
                    normal: 'cyan',
                    hover: 'white'
                  },

                  mesh: new THREE.Mesh(new THREE.PlaneGeometry(Math.PI/18,Math.PI/18,1,1), new THREE.MeshBasicMaterial({
                    map: unicorn_texture,
                    transparent: true,
                    opacity: 0.3
                  })),

                  handleTransparency: true,

                  coords: {
                    lon: -60,
                    lat: 0
                  }

                } // unicorn
              } // list
            }, // poi

            arrow: {
              list: {
                0: {
                  coords: {
                    lon: -90
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
                    lon: 87
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
                active: false
            }
        }
    },

    map: {
        active: true
    },

    // THREE.js renderer options

    renderer: {

      precision: 'lowp',

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


  var panorama=$('#pano').data('pano');

  $(document).on('keydown',function(e){
    switch(e.keyCode) {
    case 32:
      console.log('lon ['+panorama.lon+'] lat ['+panorama.lat+'] tilt ['+panorama.rotation.tilt+'] roll ['+panorama.rotation.roll+']');
      break;
    case 49:
      toggleEffect(panorama.postProcessing.edge);
      break;
    case 50:
      toggleEffect(panorama.postProcessing.edge2);
      break;
    case 77:
      var map = panorama.map;
      if(map) {
          map.active = !map.active;
      }
      break;
    }

    if (panorama.postProcessing) panorama.postProcessing.enabled=panorama.postProcessing.edge.pass.enabled||panorama.postProcessing.edge2.pass.enabled;
  });

  function toggleEffect(effect){
    effect.pass.enabled=!effect.pass.enabled;
    panorama.drawScene();
  }

});
