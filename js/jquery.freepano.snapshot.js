/*
 * freepano - WebGL panorama viewer
 *
 * Copyright (c) 2015 FOXEL SA - http://foxel.ch
 * Please read <http://foxel.ch/license> for more information.
 *
 *
 * Author(s):
 *
 *      Luc Deschenaux <l.deschenaux@foxel.ch>
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


Panorama.prototype.snapshot={
  _object_type: 'snapshot',
  size: 128,
  list: [],
  dom: "#snapshot_bar",
  toggle_button_id: "#snapshot_toggle",
  close_button_id: "#snapshot_close",

  on_panorama_init: function snapshot_on_panorama_init() {
    $('a').each(function(){this.draggable=false;});
    var panorama=this;
    var snapshot=panorama.snapshot;

    // reference panorama instance for events receivers
    snapshot.panorama=panorama;

    if (!snapshot.bar) {
      snapshot.bar=$(snapshot.dom);
      $(snapshot.close_button_id).on('click.gallery',function(e){
          snapshot.dispatch('hidebar');
      })
    }
    if (!snapshot.button) {
        snapshot.button=$(snapshot.toggle_button_id);
        snapshot.button.on('click',function(e){
            if (snapshot.panorama.ias) {
              snapshot.toggleEdit({
                keepThumb: false
              });
            } else {
              snapshot.toggleEdit();
            }
        });
    }

  }, // snapshot_on_panorama_init

  on_panorama_ready: function snapshot_on_panorama_ready() {
    var panorama=this;
    $(panorama.snapshot.toggle_button_id).show(0);
  }, // snapshot_on_panorama_ready

  // save map state and hide map
  hideMap: function snapshot_hideMap() {
    var snapshot=this;
    var panorama=snapshot.panorama;
    if (panorama._mapActive===undefined) {
      // save map state
      panorama._mapActive=panorama.map.instance.active;
      // hide map
      panorama.map.instance.active=false;
    }
  }, // snapshot_hideMap

  restoreMapState: function snapshot_restoreMapState() {
    var snapshot=this;
    var panorama=snapshot.panorama;
    if (panorama._mapActive!==undefined) {
       panorama.map.instance.active=panorama._mapActive;
       delete panorama._mapActive;
    }
  }, // snapshot_restoreMapState
  
  onhidebar: function snapshot_onhidebar(e) {
      var snapshot=this;
      var panorama=snapshot.panorama;
      snapshot.bar.css({
        opacity: 0,
        visibility: 'hidden'
      });

      if (panorama.ias) {
          snapshot.toggleEdit({keepThumb:false});
      }
  }, // snapshot_onhidebar
   
  on_panorama_mousemove: function snapshot_on_panorama_mousemove(e) {
    var panorama=this;
    if (panorama.ias) {
      return false;
    }
  }, // snapshot_on_panorama_mousemove

  on_gallery_show: function snapshot_on_gallery_show(e) {
    var gallery=this;
    var panorama=gallery.panorama;
    var snapshot=panorama.snapshot;

    // hide map and toggle_button
    snapshot.hideMap();
    $(snapshot.toggle_button_id).hide(0);
 
    // get current snapshot index
    gallery.canvas_index=$(e.canvas).data('snapshot_index');

    // update gallery next button    
    if (gallery.canvas_index+1 >= panorama.snapshot.list.length) {
      gallery.rightArrow.addClass('disabled');
    } else {
      gallery.rightArrow.removeClass('disabled');
    }

    // update gallery prev button    
    if (gallery.canvas_index <= 0) {
      gallery.leftArrow.addClass('disabled');
    } else {
      gallery.leftArrow.removeClass('disabled');
    }

  }, // snapshot_on_gallery_show

  on_gallery_hide: function snapshot_on_gallery_hide(e) {
    var gallery=this;
    var panorama=gallery.panorama;

    panorama.snapshot.restoreMapState();
     
  }, // snapshot_on_gallery_hide

  on_gallery_next: function snapshot_on_gallery_next(e) {

    var gallery=this;
    var panorama=gallery.panorama;

    if (gallery.canvas_index+1 >= panorama.snapshot.list.length) {
      return;
    }
   
   ++gallery.canvas_index;
   gallery.show($('#'+panorama.snapshot.list[gallery.canvas_index].canvas_id)[0]);

  }, // snapshot_on_gallery_next

  on_gallery_prev: function snapshot_on_gallery_prev(e) {

    var gallery=this;
    var panorama=gallery.panorama;

    if (gallery.canvas_index <= 0) {
      return;
    }

   --gallery.canvas_index;
   gallery.show($('#'+panorama.snapshot.list[gallery.canvas_index].canvas_id)[0]);

  }, // snapshot_on_gallery_next

  /**
  * snapshot.toggleEdit()
  *
  * toggle rectangle selection mode
  *
  * - without options:
  *     - when imageAreaSelect is not instantiated (ie: we are not in edit
  *     mode), enter selection mode
  *     - else discard selection and remove thumbnail
  *
  * @param options.save   keep selection and dispose imageAreaSelect instance
  * @param options.cancel  (default) discard selection and dispose imageAreaSelect instance
  * @param options.keepThumb  dont dispose thumbnail on cancel 
  */

  toggleEdit: function snapshot_toggleEdit(options) {
   var snapshot=this;
   var panorama=snapshot.panorama;
   var map=panorama.map;

   if (panorama.ias) {  // save or cancel edition 

      var canvas_id='snap'+snapshot.current;
      if (options.save) { // save

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

      } else if (options.cancel||true) { // cancel
          // remove thumbnail and cancel selection
          if (!options.keepThumb) {
            var canvas=$('canvas#'+canvas_id);
            if (canvas.length) {
              canvas.closest('.snapshot').remove();
              snapshot.list[snapshot.current-1].deleted=true;
            }
          }        
          panorama.ias.cancelSelection({keepThumb: options.keepThumb});
      } 

      snapshot.restoreMapState();

      // show toggle_button
      $(snapshot.toggle_button_id).show(0);

      // restor cursor
      $('div.freepano canvas').css('cursor','default');

      panorama.ias=null;

      return;
   }

   // enter edit mode

   $('div.freepano canvas').css('cursor','crosshair');

   snapshot.hideMap();

   // show bar
   snapshot.bar.css({
       transition: 'none',
       visibility: 'visible'
    });
 
   snapshot.bar.css({
       transition: '',
       opacity: 1
   });
      
   // set current snapshot number
   snapshot.current=snapshot.list.length+1;

   // instantiate imgAreaSelect
   panorama.ias=$(panorama.container).imgAreaSelect({

     fadeSpeed: 400,

     handles: true,

     instance: true,

     onSelectCancel: function ias_onSelectCancel(keepThumb) {

        if (snapshot.list[snapshot.current-1]) {
          // remove thumbnail
          var canvas_id='snap'+snapshot.current;
          var canvas=$('canvas#'+canvas_id);
          if (canvas.length && !keepThumb) {
            canvas.closest('.snapshot').remove();
            snapshot.list[snapshot.current-1].deleted=true;
            snapshot.list.pop();
          }
        }

        // remove imgAreaSelect instance
        $(panorama.container).imgAreaSelect({remove: true});
        panorama.ias=null;

        snapshot.restoreMapState;

        // remove filter controls
        $('#imagefilters').remove();

        // remove snapshot
        try {
          if (filters && filters.glfx) {
            $(filters.glfx.canvas).remove();
          }
        } catch(e) {
          console.log(e);
        }

        // show snapshot button
        $(panorama.snapshot.toggle_button_id).show(0);

        // restore cursor
        $('div.freepano canvas').css('cursor','default');

     }, // ias_onSelectCancel

     onSelectChange: function ias_onSelectChange(img,rect) {
       if (rect.x1==rect.x2 || rect.y1==rect.y2) return;
       this.onSelectEnd.apply(this,[img,rect]);
       $(panorama.snapshot.toggle_button_id).hide(0);
       
     }, // ias_onSelectChange

     onSelectEnd: function ias_onSelectEnd(img,rect) {

        var canvas;
        var div;
        var isnew;

        var canvas_id='snap'+snapshot.current;

        // create or update thumbnail bar element
        canvas=$('canvas#'+canvas_id);
        if (!canvas.length) {

          // wrapper
          div=$('<div class="snapshot">)');

          // get canvas from selection
          canvas=panorama.screenCapture(rect.x1,$(panorama.container).height()-rect.y1-rect.height,rect.width,rect.height);
          if (!canvas) return;
          canvas.id=canvas_id;
          isnew=true;

        } else {

          // wrapper
          div=$(canvas).closest('.snapshot');

          // update canvas from selection
          panorama.screenCapture(rect.x1,$(panorama.container).height()-rect.y1-rect.height,rect.width,rect.height,canvas[0]);

        }

        /* show canvas center in thumbnail div */

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

        /**/


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

        // new thumbnail

        if (isnew) {

          $(div).append(canvas);
          
          // custom scrollbar not instantiated ? 
          if (!$('.mCSB_container',snapshot.bar).length) {

            // add new thumb to snapshot bar container
            $(div).appendTo(snapshot.bar);

            // instantiate custom scrollbar on snapshot bar container
            snapshot.bar.mCustomScrollbar({
              axis: 'y',
              mouseWheel: {        
                  scrollAmount: 250
              }    
            });

          } else {

            // add new thumb to custom scrollbar container
            $(div).appendTo('.mCSB_container',snapshot.bar);
            snapshot.bar.mCustomScrollbar('update');
          }

          // store snapshot metadata
          snapshot.list.push({
              canvas_id: canvas_id,
              image: panorama.list.currentImage,
              rect: rect,
              lon: panorama.lon,
              lat: panorama.lat,
              zoom: panorama.camera.zoom.current
          });

          // instantiate image filters controls
          snapshot.imageFilters();

        } else {

          // update snapshot metadata
          snapshot.list[snapshot.list.length-1].rect=rect;

          // update and filter canvas over selection
          $('#imagefilters input:first').change();

        }

        $('#'+canvas_id).data('snapshot_index',snapshot.list.length-1);
                  
     } // ias_onSelectEnd

   });

  }, // snapshot_toogleEdit

  // save current snapshot bitmmap and info
  save: function snapshot_save() {
    var snapshot=this;
    var panorama=snapshot.panorama;
    var canvas_id='snap'+snapshot.current;
    var canvas=$('canvas#'+canvas_id)[0];
    var ctx=canvas.getContext('2d');
    var imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
    var buffer=new Uint8Array(imageData.data);
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
        top: 10,// $(snapshot.button).offset().top+$(snapshot.button).height()+16,
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

  } // snapshot_imageFilters

} // snapshot


// allow triggering snapshot events, allow other objects to subscribe to snapshot events
setupEventDispatcher(Panorama.prototype.snapshot);

// snapshot must subscribe to receive panorama events
Panorama.prototype.dispatchEventsTo(Panorama.prototype.snapshot);

// snapshot must subscribe to receive gallery events
Panorama.prototype.gallery.dispatchEventsTo(Panorama.prototype.snapshot);


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




