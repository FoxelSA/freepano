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

  $('#pano').panorama({

/*
    // camera field of view

    fov: {

      // initial field of view
      start: 120,

      // minimal field of view
      min: 1,

      // maximal field of view
      // fov > 120 results non-rectilinear projection
      max: 120

    }, // fov

*/

/*
    // initial panorama sphere rotation

    rotation: {

      // vertical axis rotation
      heading: 0,

      // horizontal axis rotation
      // adjust in the viewer using <shift>-mousewheel
      tilt: 0,

      // depth axis rotation
      // adjust in the viewer using <alt>-mousewheel
      roll: 0,

      // rotation step for tilt and roll adjustment
      step: 0.1

    }, // rotation

*/

/*
    limits: {

      // panorama vertical rotation limits
      lat: {
        min: -85,
        max: 85
      }

    }

*/

/*
    // camera object options

    camera: {

      zoom: {

        // initial zoom value
        current: 1.0,

        // maximal zoom value
        max: 1.5

      }

    }, // camera
*/

    // sphere object defaults
    // normally you dont need to change the parameters

    sphere: {

    /*

      radius: 15,

      widthSegments: 36,

      heightSegments: 18,

    */

      // texture options
      // You don't need this if you are using the panorama list object below

      texture: {

        // relative url of tiles directory
        dirName: 'panoramas/result_1403179805_224762-0-25-1/',

        // tile filename prefix
        baseName: 'result_1403179805_224762-0-25-1',

        // full panorama dimension, in tiles
        columns: 16,
        rows: 8

      } // texture

    }, // sphere

 /*
    // sound options

    sound: {

      list: {

        ambiance1: {
          src: ["ambiance1.mp3"]
        },

        ambiance2: {
          src: ["ambiance2.mp3"]
        }
      }

    },

*/

/*
    // points of interest

    poi: {

      // default values for POIs

      defaults: {

          // when color is set mouse event handlers are called
          color: {
             active: '#0000ff',
             hover: '#ffffff',
             normal: '#000000'
          },

          // event handlers below are already filtered
          // eg: mousein and mouseout are not triggered during panorama rotation
          // if you really need, you can bind to the private methods (eg: _mousein)

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
            this.panorama.mode.rotate=false;
            return false;
          },

          mouseup: function poi_mouseup(e) {
            console.log('mouseup',this);
          },


          click: function poi_click(e) {
            console.log('click',this);
          },
      }

      list: {

        circle: {

            coords: {
              lon: -90,
              lat: 0
            },

            // sound bound to a poi
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
                plop: {
                  src: ["plop.mp3"]
                }
              }
            }
        } // circle
      } // poi.list
    }, // poi

/*
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
            sound: {
              list: {
                1: {
                  url: "ambiance1.mp3"
                },
                2: {
                  url: "ambiance2.mp3"
                }
              }
            },
            poi: {
              list: {
                circle: {
                    color: {
                      active: '#0000ff',
                      hover: '#ffffff',
                      normal: '#000000'
                    },
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
                        plop: {
                          src: ["plop.mp3"]
                        }
                      }
                    }
                }, // circle

                square: {
                    mesh: new THREE.Mesh(new THREE.BoxGeometry(Math.PI/18,Math.PI/18,0), new THREE.MeshBasicMaterial({
                      color: 0x000000,
                      transparent: true,
                      opacity: 0.3
                    })),
                    coords: {
                      lon: -70,
                      lat: 0
                    },
                    color: {
                      active: '#0000ff',
                      hover: '#ffffff',
                      normal: '#000000'
                    },
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
                    color: {
                      active: '#0000ff',
                      hover: '#ffffff',
                      normal: '#000000'
                    },
                    coords: {
                      lon: -80,
                      lat: 0
                    }
                } // triangle

              } // list
            }, // poi
          },

          // second image
          '1403179809_224762': {
            dirName: 'panoramas/result_1403179809_224762-0-25-1',
            coords: {
              lon: 3.901933,
              lat: 43.600545,
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

/*
    // THREE.js renderer options

    renderer: {

      precision: 'lowp',

      antialias: false,

      alpha: false

    },

*/

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

    /*
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

    */
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
    panorama.postProcessing.enabled=panorama.postProcessing.edge.pass.enabled||panorama.postProcessing.edge2.pass.enabled;
  });

  function toggleEffect(effect){
    effect.pass.enabled=!effect.pass.enabled;
    panorama.drawScene();
  }

});
