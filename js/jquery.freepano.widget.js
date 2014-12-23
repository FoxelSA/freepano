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

if (typeof(PanoList)!="undefined") {
  alert("jquery.freepano.list.js must be loaded after jquery.freepano.widget.js !")
}

function Widget(options){
  if (!(this instanceof Widget)) {
    return new Widget(options)
  }
  $.extend(true,this,Widget.prototype.defaults,options);
  this.init();
}

$.extend(true, Widget.prototype, {

  defaults: {
    type: 'button',
    mesh: null,
    object3D: null,
    radius: Math.PI ,
    coords: {
      lon: 0,
      lat: 90
    },
    size: Math.PI/36,
    handleTransparency: true
  },

  // initialize widget and add to panorama scene
  init: function widget_init() {

    var widget=this;
    var panorama=widget.panorama;

    // create object3D if undefined
    if (!widget.object3D) {
      // create mesh if undefined
      if (!widget.mesh) {
        widget.mesh=widget.defaultMesh();
      }
      widget.object3D=new THREE.Object3D();
      widget.object3D.add((typeof(widget.mesh)=="function")?widget.mesh():widget.mesh);
    } else {
      if (typeof(widget.object3D)=="function") {
        widget.object3D=widget.object3D();
      }
    }

    // add to scene
    panorama.scene.add(widget.object3D);

    widget.callback({
        type: 'ready',
        target: widget
    });

  }, // widget_init

  dispose: function widget_dispose(){

    var widget=this;
    var panorama=widget.panorama;

    if (widget.object3D) {
      panorama.scene.remove(widget.object3D);
      widget.object3D=null

    }
    if (typeof(widget.mesh)=="object") {
      widget.mesh=null;
    }

  }, // widget_dispose

  // callback other classes can hook to
  callback: function widget_callback(widget_event) {

    var widget=this;

    switch (widget_event.type){

    case 'ready':
      widget.object3D.name=widget.name;
      $.each(widget.object3D.children,function(index,mesh){
        widget.panorama.widget.meshes.push(this);
      });
      break;
    case 'dispose':
      widget.dispose();
      break;
    }

  }, // widget_callback

  // create default mesh
  defaultMesh: function widget_defaultMesh() {
     var widget=this;
     var circle=new THREE.Mesh(new THREE.CircleGeometry(widget.size,100), new THREE.MeshBasicMaterial({
           color: 0x000000,
           transparent: true,
           opacity: 0.3
     }));
     return circle;
  }, // widget_defaultMesh

  // update widget display properties and coordinates

  update: function widget_update() {
    var widget=this;
    var panorama=widget.panorama;

    // set widget model view matrix to identity
    widget.mv=new THREE.Matrix4();

    // rotation around vertical axis
    widget.mv.multiply(new THREE.Matrix4().makeRotationY(-widget.coords.lon*Math.PI/180));

    // rotation around horizontal axis
    widget.mv.multiply(new THREE.Matrix4().makeRotationX(-widget.coords.lat*Math.PI/180));

    // compute widget coords
    widget.coords.vec4=new THREE.Vector4(0,0,-widget.radius,1);
    widget.coords.vec4.applyMatrix4(widget.mv);
    widget.coords.vec4.applyMatrix4(widget.panorama.rotation.matrix);

      widget.coords.vec4.applyMatrix4(panorama.viewRotationMatrix);
//    widget.coords.vec4.applyMatrix4(new THREE.Matrix4().makeRotationY(panorama.lon*Math.PI/180));
//    widget.coords.vec4.applyMatrix4(new THREE.Matrix4().makeRotationX(panorama.lat*Math.PI/180));


    widget.object3D.position.x=widget.coords.vec4.x/widget.coords.vec4.w;
    widget.object3D.position.y=widget.coords.vec4.y/widget.coords.vec4.w;
    widget.object3D.position.z=widget.coords.vec4.z/widget.coords.vec4.w;

    widget.object3D.lookAt(new THREE.Vector3(0,0,0));
//    widget.object3D.rotation.setFromRotationMatrix(new THREE.Matrix4().makeRotationY(-panorama.lon*2*Math.PI/180));

    widget.callback({
        type:'update',
        target: widget
    });

  }, // widget_update

  getCoords3D: function widget_getCoords3D(){
    var widget=this;
    var x=widget.object3D.position.x;
    var y=widget.object3D.position.y;
    var z=widget.object3D.position.z;
    // rectangular to polar coordinates
    var r=Math.sqrt(x*x+y*y+z*z);
    var phi=Math.acos(z/r);
    var theta=Math.atan2(y,x);
    // back to rectangular coordinates (to set distance from camera)
    return [
      -widget.radius*Math.sin(phi)*Math.cos(theta),
      -widget.radius*Math.sin(phi)*Math.sin(theta),
      -widget.radius*Math.cos(phi)
    ];
  }, // widget_getCoords3D

  mousein: function widget_mousein(e) {
    console.log('mousein',this);
  },

  mouseout: function widget_mouseout(e) {
    console.log('mouseout',this);
  },

  mouseover: function widget_mouseover(e) {
  },

  mousedown: function widget_mousedown(e) {
    console.log('mousedown',this);
  },

  mouseup: function widget_mouseup(e) {
    console.log('mouseup',this);
  },

  click: function widget_click(e) {
    console.log('click',this);
  },

  _mousedown: function _widget_mousedown(e){

    var widget=this;
    var widgetList=widget.panorama.widget;

    // set widget mode to active
    widgetList._active=widget;
    this.setColor(this.color.active);

    // restore widget color on mouseup
    $(document).on('mouseup.widget_mousedown',function(){
      if (widgetList._active) {
        if (widget.color && widgetList.hover.length && widgetList.hover[0].object.parent.name==widgetList._active.name) {
          widget.setColor(widget.color.hover);
          widget.panorama.drawScene();
        } else {
          widget.setColor(widget.color.normal);
          widget.panorama.drawScene();
        }
        widgetList._active=null;
      }
      $(document).off('mouseup.widget_mousedown');
    });

  }, // _widget_mousedown

  _mouseup: function _widget_mouseup(e){
    this.setColor(this.color.hover);
  }, // _widget_mouseup

  _mousein: function _widget_mousein(e){
    if (!this.color || this.panorama.mode.rotate) return;
    this.panorama.widget._hover=this;
    if (this.panorama.widget._active) {
      if (this.panorama.widget._active==this) {
        this.setColor(this.color.active);
      }
      return;
    }
    this.setColor(this.color.hover);
  }, // _widget_mousein

  _mouseout: function _widget_mouseout(e){
    if (!this.color || this.panorama.mode.rotate) return;
    this.panorama.widget._hover=null;
    this.setColor(this.color.normal);
  }, // _widget_mouseout

  setColor: function widget_setColor(color) {
    $.each(this.object3D.children,function(){
      this.material.color.set(color);
    });
    this.panorama.drawScene();
  }, // widget_setColor

  scale: function widget_scale(scaleFactor) {
    if (scaleFactor instanceof THREE.Vector3) {
      this.object3D.scale.x=scaleFactor.x;
      this.object3D.scale.y=scaleFactor.y;
      this.object3D.scale.z=scaleFactor.z;
    } else {
      this.object3D.scale.x=scaleFactor;
      this.object3D.scale.y=scaleFactor;
      this.object3D.scale.z=scaleFactor;
    }
    this.panorama.drawScene();
  } // widget_scale

}); // extend Widget.prototype

function Widget_list(options) {
    if (!(this instanceof Widget_list)) {
      return new Widget_list(options)
    }
    $.extend(true,this,Widget_list.prototype.defaults,options);
    this.init();
}

$.extend(true, Widget_list.prototype, {

    defaults: {
    },

    // save pointer to Panorama.prototype.init in Widget_list.prototype
    panorama_prototype_init: Panorama.prototype.init,

    // save pointer to Panorama.prototype.callback in Widget_list.prototype
    panorama_prototype_callback: Panorama.prototype.callback,

    // save pointer to Panorama.prototype.mousedown in Widget_list.prototype
    panorama_prototype_mousedown: Panorama.prototype.mousedown,

    init: function widgetList_init() {

      var widgetList=this;
      var panorama=widgetList.panorama;

      if (panorama.widget!=widgetList) {
        // needed when switching panoramas for obscure reason
        panorama.widget=widgetList;
      }

      if (!panorama.scene) {
        console.log('panorama.scene is undefined, cannot create POIs');
        return;
      }

      // setup widget mouse event detection
      if (!(panorama.widget.raycaster instanceof THREE.Raycaster)) {
        panorama.widget.raycaster=new THREE.Raycaster(panorama.widget.raycaster);
      }
      $('canvas:first',panorama.container).off('.widgetList').on('mousemove.widgetList mousedown.widgetList mouseup.widgetList click.widgetList',function(e) {
        if (panorama.widget) {
          return panorama.widget['on_panorama_'+e.type](e);
        }
      });

      // clear Widget mesh list
      widgetList.meshes=[];

      // instantiate POIs
      $.each(widgetList.list,function(name) {
        var widget=this;
        widgetList.list[name].instance=null;
        widgetList.list[name].instance=new Widget($.extend(true,{},widgetList.defaults,widget,{
          name: name,
          panorama: panorama
        }));
      });

      widgetList.callback({type: 'init'});

    }, // widgetList_init

    mesh_list_update: function widgetList_mesh_list_update() {
      var widgetList=this;
      widgetList.meshes=[];
      $.each(widgetList.list,function(name,widget) {
        $.each(widget.object3D.children,function(index,mesh){
          widgetList.meshes.push(this);
        });
      });
    }, // widgetList_mesh_list_update

    on_panorama_update: function widgetList_on_panorama_update(e) {

      var panorama=this;

      if (!panorama.widget) {
        return;
      }

      // update widget list on panorama 'update' event
      $.each(panorama.widget.list,function widget_update() {
        var widgetList_elem=this;
        if (widgetList_elem.instance) {
          widgetList_elem.instance.update();
        }
      });

    }, // widgetList_on_panorama_update

    on_panorama_dispose: function widgetList_on_panorama_dispose(e) {

      var panorama=this;
      if (!panorama.widget) {
        return;
      }

      // remove widget objects from scene
      $.each(panorama.widget.list,function widgetList_widget_dispose() {
        var widget=this;
        if (widget.instance){
          widget.instance.callback({type: 'dispose'});
          widget.instance=null;
        }
      });

      panorama.widget=null;

    }, // widgetList_on_panorama_dispose

    // initialize or instantiate widget list
    on_panorama_ready: function widgetList_on_panorama_ready(e) {

      var panorama=this;
      if (panorama.widget instanceof Widget_list) {
        panorama.widget.init();

      } else {
        panorama.widget=new Widget_list($.extend(true,{
          panorama: panorama
        },panorama.widget));
      }

    }, // widgetList_on_panorama_ready

    hover: [],

    // for the hover_list candidates, return those for whom the given pixel is not totally transparent
    filterHoverList: function widgetList_filterHoverList(e,hover_list) {
      var widgetList=this;
      var panorama=widgetList.panorama;
      var filtered_list=[];
      var canvas=panorama.renderer.getContext().canvas;

      // for each hover candidate
      $.each(hover_list,function(index,hover_elem){
        var material=hover_elem.object.material;

        // unless non-applicable or not requested for the related widget
        if (material.map && material.transparent && widgetList.list[hover_elem.object.parent.name].handleTransparency) {

          // create framebuffer
          if (!widgetList.renderTarget || canvas.height!=widgetList.renderTarget.height || canvas.width!=widgetList.renderTarget.width){
            widgetList.renderTarget=new THREE.WebGLRenderTarget(canvas.width,canvas.height,{
              minFilter: THREE.LinearFilter,
              stencilBuffer: false,
              depthBuffer: false
            });
          }

          // create scene
          if (!widgetList.scene) widgetList.scene=new THREE.Scene();

          // add hover candidate to scene
          widgetList.scene.add(hover_elem.object.parent);

          // render scene to framebuffer
          panorama.renderer.render(widgetList.scene,panorama.camera.instance,widgetList.renderTarget,true);

          // read pixel at mouse coordinates
          var pixel=new Uint8Array(4);
          var gl=panorama.renderer.getContext();
          gl.readPixels(e.pageX,widgetList.renderTarget.height-e.pageY,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);

          // put object back in main scene
          panorama.scene.add(hover_elem.object.parent);

          // discard widget when pixel alpha channel is null
          if (!pixel[3]) return;

        }

        // add mesh to filtered list
        filtered_list.push(hover_elem);

      });

      return filtered_list;

    }, // widgetList_filterHoverList

    on_panorama_mousemove: function widgetList_on_panorama_mousemove(e) {

      var widgetList=this;
      var panorama=this.panorama;

      if (e.pageX!=undefined) {
        // save mouse position
        panorama.pageX=e.pageX;
        panorama.pageY=e.pageY;
        panorama.clientX=e.clientX;
        panorama.clientY=e.clientY;
      } else {
        // use saved mouse position
        e.pageX=panorama.pageX;
        e.pageY=panorama.pageY;
        e.clientX=panorama.clientX;
        e.clientY=panorama.clientY;
      }

      // get mouseover_list based on raycaster
      var hover=widgetList.get_mouseover_list(e);

      if (hover.length) {
        // filter out false positive (handle transparency)
        hover=widgetList.filterHoverList(e,hover);
      }

      // if mouse is hovering a widget now
      if (hover.length) {

        // if mouse was hovering a widget before
        if (widgetList.hover.length) {

          // and it is the same one
          if (widgetList.hover[0].object.parent.name==hover[0].object.parent.name) {

            // then trigger mouseover for the widget and return
            widgetList.list[hover[0].object.parent.name].instance.mouseover(e);
            return;

          } else {
            // not the same one, trigger mouseout and continue
            widgetList.list[widgetList.hover[0].object.parent.name].instance._mouseout(e);
            widgetList.list[widgetList.hover[0].object.parent.name].instance.mouseout(e);
          }
        }

        // store current hover list
        widgetList.hover=hover;

        // trigger mousein and mouseover for the widget mouse is hovering now
        widgetList.list[hover[0].object.parent.name].instance._mousein(e);
        widgetList.list[hover[0].object.parent.name].instance.mousein(e);
        widgetList.list[hover[0].object.parent.name].instance.mouseover(e);

      } else {
        // no hover now, but if mouse was hovering a widget before
        if (widgetList.hover.length) {

            // trigger mouseout and return
            widgetList.list[widgetList.hover[0].object.parent.name].instance._mouseout(e);
            widgetList.list[widgetList.hover[0].object.parent.name].instance.mouseout(e);
            widgetList.hover=[];
            return;
        }
      }

    }, // widgetList_on_panorama_mousemove

    on_panorama_mouseevent: function widgetList_on_panorama_mousevent(e) {

      var widgetList=this;

      if (widgetList.hover.length) {

      // call handlers for first widget from hovering list
      var widget=widgetList.list[widgetList.hover[0].object.parent.name].instance;

      // 1. private mouseevent handler (for hover / active color handling)
      if (widget['_'+e.type] && widget.color) {
        widget['_'+e.type](e);
      }

      // 2. public mouseevent handler
        return widget[e.type](e);
      }
    }, // widgetList_on_panorama_mouseevent

    get_mouseover_list: function widgetList_get_mouseover_list(e) {

      var panorama=this.panorama;
      var container=$(panorama.container);
      var camera=panorama.camera.instance;
      var raycaster=panorama.widget.raycaster;

      // convert screen coordinates to normalized coordinates
      var vector=new THREE.Vector3();
      vector.set(
        (e.clientX-container.offset().left)/container.width()*2-1,
       -(e.clientY-container.offset().top)/container.height()*2+1,
       0.5
      );

      // convert normalized coordinates to world coordinates
      vector.unproject(camera);

      // create a ray from camera.position to world coordinates
      raycaster.ray.set(camera.position, vector.sub(camera.position).normalize());

      // find meshes intersecting with this ray
      return raycaster.intersectObjects(panorama.widget.meshes);

    }, // widgetList_get_mousover_list

    callback: function widgetList_callback(widgetList_event) {
    }

});

$.extend(true,Widget_list.prototype,{
    on_panorama_mousedown: Widget_list.prototype.on_panorama_mouseevent,
    on_panorama_mouseup: Widget_list.prototype.on_panorama_mouseevent,
    on_panorama_click: Widget_list.prototype.on_panorama_mouseevent
});

$.extend(true,Panorama.prototype,{

  defaults: {
    renderer: {
      preserveDrawingBuffer: true
    }
  },

  init: function widgetList_panorama_init() {

      var panorama=this;

      // skip Widget_list instantiation if widget list preferences undefined in panorama
      if (panorama.widget!==undefined) {

        // or if widget list is already instantiated
        if (!(panorama.widget instanceof Widget_list)) {

          // instantiate widget list
          panorama.widget=new Widget_list($.extend(true,{

            // pass panorama instance pointer to widget list instance
            panorama: panorama,

          },panorama.widget));
        }
      }

      // chain with old panorama.prototype.init
      Widget_list.prototype.panorama_prototype_init.call(panorama);

  }, // widgetList_panorama_init

  // hook to Panorama.prototype.callback
  callback: function widgetList_panorama_prototype_callback(e) {

    var panorama=this;

    if (panorama.widget){
      if (panorama.widget['on_panorama_'+e.type]) {
        panorama.widget['on_panorama_'+e.type].apply(panorama,[e]);
      } else {
        if (Widget_list.prototype['on_panorama_'+e.type]) {
          Widget_list.prototype['on_panorama_'+e.type].apply(panorama,[e]);
        }
      }
    }

    // chain with old panorama.prototype.callback
    Widget_list.prototype.panorama_prototype_callback.apply(panorama,[e]);

  }, // widgetList_panorama_prototype_callback

  // hook to Panorama.prototype.mousedown
  mousedown: function widgetList_panorama_prototype_mousedown(e) {

    var panorama=this;

    // call previous panorama.prototype.callback
    var ret=Widget_list.prototype.panorama_prototype_mousedown.apply(panorama,[e]);

    // unset panorama.mode.rotate when mousedown activated a widget
    if (panorama.widget && panorama.widget._active){
      panorama.mode.rotate=false;
    }

    return ret;

  }

}); // extend Panorama.prototype

