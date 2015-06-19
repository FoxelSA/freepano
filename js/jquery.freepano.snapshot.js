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

  // since snapshot is a generic object, specify _object_type for event dispatcher
  _object_type: 'snapshot',

  size: 128,
  list: [],
  dom: "#snapshot_bar",
  toggle_button_id: "#snapshot_toggle",
  close_button_id: "#snapshot_close",
  sliders_container: 'body',
  filter_list: [
    [ 'glfx', 'vibrance' ],
    [ 'glfx', 'sepia' ],
    [ 'glfx', 'brightnessContrast' ],
    [ 'glfx', 'vignette' ]
  ],


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

  add: function snapshot_add(options) {
    var snapshot=this;
    var div=$('<div class="snapshot">)');
    var canvas=options.canvas;

    snapshot.showCanvasCenterInDiv(div,canvas);
    snapshot.addToBar($.extend(true,{},options,{
      div: div
    }));

  },   // snapshot_add

  addToBar: function snapshot_addToBar(options) {

    var snapshot=this;
    var canvas=options.canvas;
    var div=options.div;

    div.append(canvas);

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

      snapshot.dispatch('bar_init');

    } else {

      // add new thumb to custom scrollbar container
      $(div).appendTo('.mCSB_container',snapshot.bar);
      snapshot.bar.mCustomScrollbar('update');
    }

    // store snapshot metadata
    var metadata= {
        canvas_id: options.canvas.id,
        image: options.image,
        description: options.description,
        rect: options.rect,
        lon: options.lon,
        lat: options.lat,
        zoom: options.zoom,
        url: options.url
    };
    snapshot.list.push(metadata);

  }, // snapshot_addToBar

  on_panorama_ready: function snapshot_on_panorama_ready() {
    var panorama=this;
    // show snapshot mode toggle button
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

      snapshot.hideBar();

      if (panorama.ias) {
          snapshot.toggleEdit({keepThumb:false});
      }
  }, // snapshot_onhidebar

  showBar: function snapshot_showBar() {
     var snapshot=this;
     snapshot.bar.css({
         transition: 'none',
         visibility: 'visible'
      });
     snapshot.bar.css({
         transition: '',
         opacity: 1
     });

  }, // snapshot_showbar

  hideBar: function snapshot_hideBar() {
      var snapshot=this;
      snapshot.bar.css({
        opacity: 0,
        visibility: 'hidden'
      });

  }, // snapshot_hideBar

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
    gallery.canvas_index=snapshot.indexOf(e.canvas);

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

      var canvas_id=snapshot.canvas_id;
      if (options.save) { // save

        // copy filtered canvas
        var canvas=$('#'+canvas_id)[0];
        var ctx=canvas.getContext('2d');
        drawGlImage(ctx,filters.glfx.canvas._.gl);
        $(canvas).css({
          transform: 'none'
        })
        panorama.ias.cancelSelection({keepThumb: true});

        snapshot.dispatch({
          type: 'saved',
          canvas: canvas
        });

      } else if (options.cancel||true) { // cancel
          // remove thumbnail and cancel selection
          if (!options.keepThumb) {
            var canvas=$('canvas#'+canvas_id);
            if (canvas.length) {
              canvas.closest('.snapshot').remove();
              snapshot.list.pop();
            }
          }
          panorama.ias.cancelSelection({keepThumb: options.keepThumb});
      }

      snapshot.dispatch({
        type: 'mode',
        mode: {
          name: 'edit',
          value: false
        }
      });

      snapshot.restoreMapState();

      // show toggle_button
      $(snapshot.toggle_button_id).show(0);

      // restor cursor
      $('div.freepano canvas').css('cursor','default');

      panorama.ias=null;

      return;
   }

   // enter edit mode
   snapshot.dispatch({
     type: 'mode',
     mode: {
       name: 'edit',
       value: true
     }
   });

   $('div.freepano canvas').css('cursor','crosshair');

   snapshot.hideMap();

   snapshot.showBar();

   // set index for ias
   snapshot.index=snapshot.list.length;

   // instantiate imgAreaSelect
   panorama.ias=$(panorama.container).imgAreaSelect({

     fadeSpeed: 400,

     handles: true,

     instance: true,

     onSelectCancel: function ias_onSelectCancel(keepThumb) {

        if (snapshot.list.length) {
          // remove thumbnail
          var canvas_id=snapshot.list[snapshot.list.length-1].canvas_id;
          var canvas=$('canvas#'+canvas_id);
          if (canvas.length && !keepThumb) {
            canvas.closest('.snapshot').remove();
            snapshot.list.pop();
          }
        }

        // remove imgAreaSelect instance
        $(panorama.container).imgAreaSelect({remove: true});
        panorama.ias=null;

        snapshot.restoreMapState;

        // remove filter controls
        $('#imagefilters',snapshot.sliders_container).remove();

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

        if (snapshot.index<snapshot.list.length) {
          canvas_id=snapshot.list[snapshot.index].canvas_id;
          canvas=$('canvas#'+canvas_id);
        }  else {
          canvas_id=snapshot.canvas_id='snap'+new Date().getTime();
          canvas=[];
        }

        // create or update thumbnail bar element
        if (!canvas.length) {

          if (rect.x1==rect.x2 && rect.y1==rect.y2) {
            // simple click, exit edit mode
            snapshot.dispatch({
              type: 'mode',
              mode: {
                name: 'edit',
                value: false
              }
            });
          }

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

        snapshot.showCanvasCenterInDiv(div,canvas);

        /**/


/*
          // preserve ratio, use max thumbnail height

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

          // add to snapshot bar
          snapshot.addToBar({
            div: div,
            canvas: canvas,
            image: panorama.list.currentImage,
            rect: rect,
            lon: panorama.lon,
            lat: panorama.lat,
            zoom: panorama.camera.zoom.current
          });

          // instantiate image filters controls
          snapshot.imageFilters();

          snapshot.dispatch({
            type: 'selection_start',
            metadata: snapshot.getMetadata(canvas)
          });

        } else {

          // update snapshot metadata
          snapshot.list[snapshot.list.length-1].rect=rect;

          // update and filter canvas over selection
//          $$$('#imagefilters input:first',snapshot.sliders_container).change();
          snapshot.processFilters();

        }

        if (rect.x1==rect.x2 && rect.y1==rect.y2) {
          // simple click, exit edit mode
          snapshot.dispatch({
            type: 'mode',
            mode: {
              name: 'edit',
              value: false
            }
          });
        }

     } // ias_onSelectEnd

   });

  }, // snapshot_toogleEdit

  showCanvasCenterInDiv: function snapshot_showCanvasCenterInDiv(thumbnail_div,canvas) {

    var snapshot=this;
    var div=thumbnail_div;

    /* show canvas center in thumbnail div */

    var displayRatio=5/4;
    var imageRatio=$(canvas)[0].width/$(canvas)[0].height;
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

  }, // snapshot_showCanvasCenterInDiv

  save: function snapshot_save() {
    var snapshot=this;
    // trigger save event(allow receivers to cancel save, eg validation)
    snapshot.dispatch('save');
  }, // snapshot_save

  // keep snapshot
  onsave: function snapshot_onsave() {
    var snapshot=this;
    snapshot.toggleEdit({
      save: true,
      keepThumb: true
    });
  }, // snapshot_onsave

  /**
   * snapshot.getDownloadLink()
   *
   * Upload canvas data and return download link
   * On error, a message is notified and the callback is called without url
   *
   * @param options.canvas  defaults to current snapshot canvas (last of snapshot.list)
   * @param options.metadata
   * @param options.callback function receiving url (can specify '&filename=')
   *
   */
  getDownloadLink: function snapshot_getDownloadLink(options) {
    var snapshot=this;
    var panorama=snapshot.panorama;
    var canvas;
    var query_string=options.query_string||"image.php?action=upload";

    if (options.canvas) {
      // specified snapshot
      canvas=options.canvas;

    } else {
      // else current snapshot
      canvas=$('canvas#'+snapshot.list[snapshot.list.length-1].canvas_id)[0];

    }
    var canvas_id=canvas.id;

    // mirror vertically if requested
    if (options.flipY) {
      canvas=flipCanvas(canvas);
    }

    var raw;
    var buffer;

    // try converting dataURL to ArrayBuffer
    try {

      var marker=';base64,';
      var dataURL=canvas.toDataURL();
      var markerPos=dataURL.search(marker);
      var contentType=dataURL.substr(0,markerPos).split(':')[1];
      var dataOffset=markerPos+marker.length;

      buffer=new Uint8Array(dataURL.length-dataOffset);
      dataURL=atob(dataURL.substr(dataOffset));
      for (var i=0; i<dataURL.length; ++i) {
        buffer[i]=dataURL.charCodeAt(i);
      }

      query_string+='&type='+encodeURIComponent(contentType)+'&encoding=binary';

    // send raw image as failover
    } catch(e) {

      var ctx=canvas.getContext('2d');
      var imageData=ctx.getImageData(0,0,canvas.width,canvas.height);

      buffer=new Uint8Array(imageData.data);

      query_string+=
        '&type='+encodeURIComponent('image/raw')
      + '&h='+canvas.height
      + '&w='+canvas.width;

    }

    var xhr = new XMLHttpRequest();

    if (options.store) {
      var metadata=options.metadata||snapshot.getMetadata(canvas_id);
      query_string+='&store=1&metadata='+btoa(JSON.stringify(metadata));
    }

    xhr.open('POST', query_string, options.async);

    xhr.onload = function() {
      var response=JSON.parse(xhr.response);
      if (response.status!="ok") {
        $.notify('Error: could not process image');
        console.log('load',arguments,xhr);
        options.callback();
        return;
      }
      options.callback('image.php?action=download&image='+response.filename);
    };

    xhr.onerror=function(){
      console.log('loaderror',arguments);
      $.notify('Error: server request failed');
      options.callback();
    }

    xhr.send(buffer);

  }, // getDownloadLink

  // return snapshot.list index for specified canvas or canvas id
  indexOf: function snapshot_indexOf(canvas) {
    var snapshot=this;
    var canvas_id=(typeof(canvas)=="string")?canvas:$(canvas)[0].id;
    var index;

    $.each(snapshot.list,function(k,properties){
        if (properties.canvas_id==canvas_id) {
          index=k;
          return false;
        }
    });
    return index;
  }, // snapshot_indexOf

 // remove specified canvas or canvas id
  remove: function snapshot_remove(canvas) {
    var snapshot=this;
    var gallery=snapshot.panorama.gallery;

    var index=snapshot.indexOf(canvas);
    if (index==undefined) {
      console.log('error: canvas not referenced',canvas);
      return;
    }

   // get snapshot canvas id
   var canvas_id=snapshot.list[index].canvas_id;

   // remove snapshot from list
   snapshot.list.splice(index,1);

   // remove snapshot from bar
   $('canvas#'+canvas_id,snapshot.bar).closest('.snapshot').remove();

   // gallery is visible
   if (gallery.overlay.is(':visible')) {
     // removed the current gallery snapshot
     if (gallery.canvas_index==index) {

       // last snapshot removed ?
       if (!snapshot.list.length) {
         // close gallery and hide bar
         gallery.hide();
         snapshot.dispatch('hidebar');
         return;
       }

       // removed snapshot in the middle of the list
       if (snapshot.list.length>gallery.canvas_index) {
         // display next snapshot
         gallery.show($('#'+snapshot.list[gallery.canvas_index].canvas_id)[0]);
         return;
       }

       // removed snapshot at the end of the list
       if (snapshot.list.length==gallery.canvas_index) {
         // display previous snapshot
         --gallery.canvas_index;
         gallery.show($('#'+snapshot.list[gallery.canvas_index].canvas_id)[0]);
         return;
       }

     } else {
       if (gallery.canvas_index>index) {
         --gallery.canvas_index;
       }
     }

   }

  }, // snapshot_remove

  // return snapshot metadata for canvas or canvas_id
  getMetadata: function snapshot_getMetadata(canvas) {
    var snapshot=this;
    var index=snapshot.indexOf(canvas);

    return index!=undefined?snapshot.list[index]:null;

  }, // snapshot_getMetadata

  imageFilters: function snapshot_imageFilters() {
    var snapshot=this;
    var container=snapshot.imageFilters.container=$('#imagefilters',snapshot.sliders_container);

    // create container for image filter widgets
    if (!container.length) {
      container=$('<div id="imagefilters">').appendTo(snapshot.sliders_container).css({
      //  backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 8,
        marginBottom: 24
      //  boxShadow: '5px 5px 5px 0px rgba(0,0,0,0.4)'
      });
      //.style('#imagefilters');
    }

    //
    if ($(container).data('snapshot')!=snapshot.list[snapshot.list.length-1].canvas_id) {

      var canvas_id=snapshot.list[snapshot.list.length-1].canvas_id;

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

        var imageFilter=new ImageFilter({
          target: '#'+canvas_id,
          container: $('.filter.'+filter, container),
          filter: filter,
          filterType: filterType
        });

        snapshot._imageFilter=imageFilter;
        snapshot.processFilters=function() {
          this._imageFilter.processFilters();
        }

      } // addFilter


      // display filter controls
      container.empty();
      $.each(snapshot.filter_list,function(){
        addFilter(this[0],this[1]);
      });

      // get ImageFilters list
      var filters=window.filters=$('#'+canvas_id).parent().data('filters');

      // overlay canvas setup setup procedure
      filters.canvas_setup=function(canvas,isupdate){

        var rect=snapshot.list[snapshot.list.length-1].rect;

        // adding
        if (!isupdate) {
          $(canvas).appendTo('body');
        }

        // positioning
        $(canvas).css({
          position: 'absolute',
          left: rect.x1,
          top: rect.y1,
          width: rect.x2-rect.x1+1,
          height: rect.y2-rect.y1+1,
          transform: 'scaleY(-1)'
        });

      } // canvas_setup

      // apply filters
      $('input',snapshot.sliders_container).trigger('change');

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


// return the parent window object of the first element matching the specified jquery selector and optional context
function getWindow(selector,context) {
  var elem=$.apply($,Array.prototype.slice.apply(arguments));
  var doc=elem[0].ownerDocument;
  return doc.defaultView||doc.parentWindow;
}

// return the jquery object reference of the first element matching selector and optional context
function $$$(selector,context) {
  var args=Array.prototype.slice.apply(arguments);
  var $=getWindow.apply(window,args).$;
  return $.apply($,args);
}

/**
* flipCanvas(canvas)
*
* mirror specified canvas vertically
*
* @param canvas the canvas to flip
* @return flipped new canvas
*/
function flipCanvas(canvas) {

  try {
    var flipped=document.createElement('canvas');
    flipped.height=canvas.height;
    flipped.width=canvas.width;

    var ctx=flipped.getContext('2d');
    ctx.scale(1,-1);
    ctx.drawImage(canvas,0,0,canvas.width,-canvas.height);

  } catch(e) {
    console.log(e);

    // calling drawImage with negative height is broken in Firefox (2015-06-19)
    // https://bugzilla.mozilla.org/show_bug.cgi?id=974367

    var flipped=document.createElement('canvas');
    flipped.height=canvas.height;
    flipped.width=canvas.width;

    var ctx=flipped.getContext('2d');
    var lastLine=canvas.height-1;
    for(var y = 0; y < canvas.height; ++y) {
      ctx.drawImage(canvas, 0, y, canvas.width, 1, 0, lastLine-y, canvas.width, 1);
    }

  }

  return flipped;

}

