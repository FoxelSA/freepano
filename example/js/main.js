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


    rotation: {
      heading: -90,
      tilt: 0,
      roll: 0
    },

    camera: {
      zoom: {
        max: 1.5
      }
    },

    fov: {
      max: 140,
      start: 120
    },

/*
    // for a single panorama (when not using list below) , or for sphere and texture defaults
    sphere: {
      texture: {
        dirName: 'panoramas/result_1403179805_224762-0-25-1/',
        baseName: 'result_1403179805_224762-0-25-1',
        columns: 4,
        rows: 2
      }
    },
*/

    list: {
        defaults: {
          dirName: 'panoramas/result_1403179805_224762-0-25-1',
          prefix: 'result_',
          suffix: '-0-25-1',
          columns: 16,
          rows: 8
        },

//      initialImage: '1403179809_224762',

        images: {
          '1403179805_224762': {
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
            poi_list: {
              list: {
                test: {
                    shape: {
                      type: 'sphere'
                    },
                    coords: {
                      lon: -90,
                      lat: 0
                    },
                    sound: {
                      list: {
                        beep: {
                          url: "beep.mp3"
                        },
                        plop: {
                          url: "plop.mp3"
                        }
                      }
                    }
                },
                test1: {
                    shape: {
                      type: 'sphere'
                    },
                    coords: {
                      lon: -70,
                      lat: 0
                    }
                },
                test2: {
                    shape: {
                      type: 'sphere'
                    },
                    coords: {
                      lon: -80,
                      lat: 0
                    }
                }
              }
            },
          },

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

    renderer: {
      precision: 'lowp',
      antialias: false,
      alpha: false

    },

// incompatible with panorama.list below yet
    __pyramid: { /* remove the two underscores to use it */
      dirName: 'panoramas/result_1403179805_224762-0-25-1/512',
      baseName: 'result_1403179805_224762-0-25-1',
      levels: 4,
      preload: true
      /*
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
      */
    },

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
    panorama.postProcessing.enabled=panorama.postProcessing.edge.pass.enabled||panorama.postProcessing.edge2.pass.enabled;
  });

  function toggleEffect(effect){
    effect.pass.enabled=!effect.pass.enabled;
    panorama.drawScene();
  }

});
