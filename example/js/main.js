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
      tilt: 90,
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
                test: {
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
                          coneInnerAngle: 90,
                          coneOuterAngle: 180,
                          coneOuterGain: 0,
                          rolloffFactor: 0
                        },
                        plop: {
                          url: "plop.mp3"
                        }
                      }
                    }
                }, // test
/*        
                test1: {
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
                }, // test1
                
                test2: {
                    wesh: function test2_mesh() {
                    	var poi=this;
                    	var geometry=new THREE.Geometry();
                    	var s=poi.size;
                    	geometry.vertices.push(new THREE.Vector3(-s,-s,0));
                       	geometry.vertices.push(new THREE.Vector3(s,-s,0));
                    	geometry.vertices.push(new THREE.Vector3(0,s,0));
                    	geometry.faces.push(new THREE.Face3(0, 2, 1));
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
                } // test2
*/
              } // list
            }, // poi
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
        active: false
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
