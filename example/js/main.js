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


  var panorama=$('#pano').data('pano');

  $(document).on('keydown',function(e){
    switch(e.keyCode) {
    case 32: // space
      console.log('lon ['+panorama.lon+'] lat ['+panorama.lat+'] tilt ['+panorama.rotation.tilt+'] roll ['+panorama.rotation.roll+']');
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
    case 13: // enter
       if (!panorama.ias) break;
       // continue with case 80: below
    
    case 80: // p
       var map=panorama.map;
       var snapshot=panorama.snapshot;
          
       if (panorama.ias) {
   
          var canvas_id='snap'+snapshot.current;
          if (e.keyCode==13) {

            // copy filtered canvas
            var canvas=$('#'+canvas_id)[0];
            var ctx=canvas.getContext('2d');
            drawGlImage(ctx,filters.glfx.canvas._.gl);
            $(canvas).css({
              transform: 'none'
            })
            // save thumbnail
        //    snapshot.save();
            panorama.ias.cancelSelection({keepThumb: true});

          } else {
              // remove thumbnail
              var canvas=$('canvas#'+canvas_id);
              if (canvas.length) {
                canvas.closest('.snapshot').remove();
                snapshot.list[snapshot.current-1].deleted=true;
              }        
              panorama.ias.cancelSelection({keepThumb: false});
          }

          // cancel selection

          // restore map state
          map.instance.active=panorama._mapActive;

          return;
       }

       // save map state 
       panorama._mapActive=map.instance.active;

       // hide map
       map.instance.active=false;

       // set current snapshot number
       snapshot.current=snapshot.list.length+1;

       // instantiate imgAreaSelect
       panorama.ias=$(panorama.container).imgAreaSelect({

         fadeSpeed: 400,

         handles: true,

         instance: true,

         onSelectCancel: function(keepThumb) {

            if (!snapshot.list[snapshot.current-1]) return;
            var canvas_id='snap'+snapshot.current;

            // remove thumbnail
            var canvas=$('canvas#'+canvas_id);
            if (canvas.length && !keepThumb) {
              canvas.closest('.snapshot').remove();
              snapshot.list[snapshot.current-1].deleted=true;
            }
           
            // remove imgAreaSelect instance
            $(panorama.container).imgAreaSelect({remove: true});
            panorama.ias=null;

            // restore map state
            map.instance.active=panorama._mapActive;


            $('#imagefilters').remove();

            $(filters.glfx.canvas).remove();

           
     
         },

         onSelectChange: function(img,rect) {
           if (rect.x1==rect.x2 || rect.y1==rect.y2) return;
           this.onSelectEnd.apply(this,[img,rect]);
         },

         onSelectEnd: function(img,rect) {

            var canvas;
            var div;
            var isnew;

            var canvas_id='snap'+snapshot.current;

            // create or update thumbnail bar element
            canvas=$('canvas#'+canvas_id);
            if (!canvas.length) {
              // create a new element
              div=$('<div class="snapshot">)');
              canvas=panorama.getCanvas(panorama.renderer,rect.x1,$(panorama.container).height()-rect.y1-rect.height,rect.width,rect.height);
              if (!canvas) return;
              // get canvas from selection
              canvas.id=canvas_id;
              isnew=true;

            } else {
              div=$(canvas).closest('.snapshot');
              panorama.getCanvas(panorama.renderer,rect.x1,$(panorama.container).height()-rect.y1-rect.height,rect.width,rect.height,canvas[0]);

            }

            var displayRatio=5/4;
            var imageRatio=rect.width/rect.height;
            var div_width=snapshot.size*displayRatio;
            if (imageRatio>displayRatio) {
               $(canvas).css({
                  position: 'absolute',
                  width: snapshot.size*imageRatio,
                  height: snapshot.size,
                  top: -99999,
                  bottom: -99999,
                  left: -99999,
                  right: -99999,
                  margin: 'auto'
               });
            } else {
               $(canvas).css({
                  position: 'absolute',
                  width: snapshot.size*displayRatio,
                  height: (snapshot.size*displayRatio)/imageRatio,
                  top: -99999,
                  bottom: -99999,
                  left: -99999,
                  right: -99999,
                  margin: 'auto'
               });
              
            }

            $(div).css({
               width: snapshot.size*displayRatio,
               height: snapshot.size,
               marginTop: 0,
               marginBottom: 8,
               position: 'relative',
               float: 'left',
               overflow: 'hidden'
            });

                          
/*
              // compute canvas display size
              var ratio=rect.width/rect.height;
              if (ratio>1) {                
                $(canvas).add(div).css({
                  width: snapshot.size*ratio,
                  height: snapshot.size,
                  marginTop:0,
                  marginBottom:0
                });
/*                
                $(canvas).add(div).css({
                  width: snapshot.size,
                  height: snapshot.size/ratio
                });
                console.log('xo')
                $(canvas).css('margin-bottom',(snapshot.size-snapshot.size/ratio)/2);
                $(canvas).css('margin-top',(snapshot.size-snapshot.size/ratio)/2);
*//*
              } else {
                $(canvas).add(div).css({
                  width: snapshot.size*ratio,
                  height: snapshot.size,
                  marginTop: 0,
                  marginBottom: 0
                });
              }
*/
            if (isnew) {

              $(div).append(canvas);
              if (!$('.mCSB_container',snapshot.bar).length) {
                $(div).appendTo(snapshot.bar);
                if (true) // bullshit
                snapshot.bar.mCustomScrollbar({
                  axis: 'y',
                  mouseWheel: {        
                      scrollAmount: 250
                  }    
                });
              } else {
                $(div).appendTo('.mCSB_container',snapshot.bar);
                snapshot.bar.mCustomScrollbar('update');
              }

              snapshot.list.push({
                  image: panorama.list.currentImage,
                  rect: rect,
                  lon: panorama.lon,
                  lat: panorama.lat,
                  zoom: panorama.camera.zoom.current
              });

   //           setTimeout(function(){
                snapshot.imageFilters();
     //         },0);

            } else {
              snapshot.list[snapshot.list.length-1].rect=rect;
              $('#imagefilters input:first').change();
            }          
         }

       });

      break;
    }

    if (panorama.postProcessing) panorama.postProcessing.enabled=panorama.postProcessing.edge.pass.enabled||panorama.postProcessing.edge2.pass.enabled||panorama.postProcessing.green.pass.enabled;

  }); // keydown


  // apply clicked snapshot image filter parameters to current selection
  $('#snapshot_bar').on('click','canvas',function(e){
    if (!panorama.ias) {
      gallery.show(e.target);
      return;
    }
    var filters=$(e.target).parent().data('filters');
    $.each(filters.widget,function(){
      var widget=this;
      $('#imagefilters .filter.'+widget.imageFilter.filter+' '+'.parameter.'+widget.name+' input').val(widget.value).trigger('change');
    });

  });

  function toggleEffect(effect){
    effect.pass.enabled=!effect.pass.enabled;
    panorama.drawScene();
  }

}); // filesloaded

Panorama.prototype.getCanvas=function(renderer,x,y,w,h,canvas) {
  var panorama=this;

  if (w==0 || h==0) return canvas;

  panorama.renderer.render(panorama.scene,panorama.camera.instance);

  // create or update canvas
  if (!canvas) canvas=document.createElement('canvas');
  canvas.width=w;
  canvas.height=h;

  var ctx=canvas.getContext('2d');

  // allocate memory for image
  var imageData=ctx.createImageData(w,h);
  var bitmap=new Uint8Array(w*h*4);

  // read bitmap from webgl buffer
  var gl=renderer.getContext();
  gl.readPixels(x,y,w,h,gl.RGBA,gl.UNSIGNED_BYTE,bitmap);

  // write bitmap to canvas
  imageData.data.set(bitmap);
  ctx.putImageData(imageData,0,0);
  
  return canvas;
  
} // panorama_getCanvas

Panorama.prototype.snapshot={
  size: 128,
  list: [],
  dom: "#snapshot_bar",
  on_panorama_init: function() {
    var panorama=this;
    var snapshot=panorama.snapshot;
    snapshot.panorama=panorama;
    if (!snapshot.bar) {
      snapshot.bar=$(snapshot.dom);
    }
  },
  // save current snapshot bitmmap and info
  save: function snapshot_save() {
    var snapshot=this;
    var panorama=snapshot.panorama;
    var canvas_id='snap'+snapshot.current;
    var canvas=$('canvas#'+canvas_id)[0];
    var ctx=canvas.getContext('2d');
    var imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
    var buffer=new Uint8Array(imageData.data);
    //snapshot.list[snapshot.current-1];
    console.log(buffer.length);
    var metadata=snapshot.list[snapshot.current-1];   

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'savethumb.php?index='+snapshot.current+'&image='+metadata.image+'&h='+metadata.rect.height+'&w='+metadata.rect.width+'&z='+metadata.zoom+'&lon='+metadata.lon+'&lat='+metadata.lat, true);
    xhr.onload = function() {
      console.log('load',arguments,xhr); 
    };
    xhr.onerror=function(){
      console.log('loaderror',arguments);
    }
    xhr.send(buffer);

  },

  load: function snapshot_load() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'listthumbs.php', true);
    xhr.onload = function() {
      console.log('load',arguments,xhr); 
    };
    xhr.onerror=function(){
      console.log('loaderror',arguments);
    }
    xhr.send();

  },

  imageFilters: function snapshot_imageFilters(action) {
    var snapshot=this;
    var container=snapshot.imageFilters.container=$('#imagefilters');

    // create container for image filter widgets
    if (!container.length) {
      container=$('<div id="imagefilters">').appendTo('body').css({
        top: 10,
        left: 10,
        position: 'absolute',
        color: 'white',
        width: 340
      });
    }

    // 
    if ($(container).data('snapshot')!=snapshot.current) {

      var canvas_id='#snap'+snapshot.current;
 
      /**
      * addFilter()
      *
      */     
      function addFilter(filterType,filter) {

        $('<fieldset><div class="filter '+filter+'"></div></fieldset>')
        .appendTo(container);

        $('.filter.'+filter, container).css({
          margin: 10
        });
        
        return new ImageFilter({
          target: canvas_id,
          container: $('.filter.'+filter, container),
          filter: filter,
          filterType: filterType
        });

      } // addFilter

      container.empty();

      addFilter('glfx','vibrance');
      addFilter('glfx','sepia');

      addFilter('glfx','brightnessContrast');
  //    addFilter('caman','gamma');
    //  addFilter('glfx','denoise');
      addFilter('glfx','vignette');


  
      // get ImageFilters list
      var filters=window.filters=$(canvas_id).parent().data('filters');
      
      // 
      filters.canvas_setup=function(canvas,isupdate){

        var rect=snapshot.list[snapshot.current-1].rect;
        
        if (!isupdate) {
          $(canvas).appendTo('body');
        }

        $(canvas).css({
          position: 'absolute',
          left: rect.x1,
          top: rect.y1,
          width: rect.x2-rect.x1+1,
          height: rect.y2-rect.y1+1,
          transform: 'scaleY(-1)'
        });
        
      }

      $('input').trigger('change');
//      addSlider('exposure');
//      addSlider('vibrance');
    
    }

  }

}

/*
* drawGlImage()
*
* copy the specified rect from a WebGL canvas to the 2d canvas context specified
* 
* returns a new canvas if ctx is null 
*
*/
function drawGlImage(ctx,gl,x,y,w,h,destx,desty) {
 
  if (x==undefined) x=0;
  if (y==undefined) y=0;
  if (w==undefined) w=gl.drawingBufferWidth;
  if (h==undefined) h=gl.drawingBufferHeight;
  if (destx==undefined) destx=0;
  if (desty==undefined) desty=0;
  
  if (!ctx) {
    var canvas=document.createElement('canvas');
    canvas.width=w;
    canvas.height=h;
    ctx=canvas.getContext('2d');
  }


  // allocate memory for image
  var imageData=ctx.createImageData(w,h);
  var bitmap=new Uint8Array(w*h*4);

  // read bitmap from webgl buffer
  gl.readPixels(x,y,w,h,gl.RGBA,gl.UNSIGNED_BYTE,bitmap);

  // write bitmap to canvas
  imageData.data.set(bitmap);
  ctx.putImageData(imageData,destx,desty);
  
  return canvas;
  
} // drawGlImage

Panorama.prototype.dispatchEventsTo(Panorama.prototype.snapshot);



