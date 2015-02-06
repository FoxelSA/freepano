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
  alert("jquery.freepano.list.js must be loaded after jquery.freepano.widget.js !");
}

function WidgetFactory(options) {

  var root=window;         // root element, default is window
  var widgetName;          // widget name

  if (typeof(options)=="string") {
    widgetName=options;

  } else {
    root=options.root||root;
    widgetName=options.widgetName;
  }

  // create constructors for widgetName and widgetName_list
  var suffix=['','_list'];
  $.each(suffix,function(idx,_suffix){
    var name=widgetName+_suffix;
    // eval() is required here so that constructor.name is widgetName instead of 'Function'
    eval(
      'root[name]=function '+name+'(options){this._constructor(options)};'+
      'root[name].prototype._constructor=function(_options){'+
      '  if (!(this instanceof root[name])) {return new root[name](_options);};'+
      '  $.extend(true,this,root[name].prototype.defaults,_options);'+
      '  this.init();'+
      '}'
    );
  });

  // register widget type
  if (!root.widgetTypes) {
    root.widgetTypes=[];
  }

  if (root.widgetTypes.indexOf(widgetName)<0) {
    root.widgetTypes.push(widgetName);
  } else {
    console.log('warning: widget "'+widgetName+'" redeclared');
  }

  // populate prototypes
  (function(Widget,WidgetList){

    $.extend(true, Widget.prototype, {

      defaults: {
        overlay: true,
        mesh: null,
        object3D: null,
        radius: Math.PI ,
        coords: {
          lon: 0,
          lat: 90
        },
        size: Math.PI/36,
        handleTransparency: true,
        lookAtVec3: new THREE.Vector3(0,0,0)
      },

      // initialize widget and add to panorama scene
      init: function widget_init() {

        var widget=this;
        var panorama=widget.panorama;

        // if no custom scene or camera specified for raycasting (eg orthographic HUD)
        if (!widget.scene) {
          // then use the panorama ones
          widget.scene=panorama.scene;
        }
        if (!widget.camera) {
          widget.camera=panorama.camera;
        }

        // create object3D if undefined
        if (!widget.object3D) {
          widget.object3D=new THREE.Object3D();

          // create mesh if undefined
          if (!widget.mesh) {
            widget.mesh=widget.defaultMesh();
          }

          // add mesh to object3D, mesh can be a function
          widget.object3D.add((typeof(widget.mesh)=="function")?widget.mesh():widget.mesh);

        } else {
          // object3D can be a function
          if (typeof(widget.object3D)=="function") {
            widget.object3D=widget.object3D();
          }
        }

        // add widget to scene
        widget.scene.add(widget.object3D);

        // trigger widget 'ready' callback
        widget.callback('ready');

      }, // widget_init

      remove: function widget_remove(){

        var widget=this;
        var panorama=widget.panorama;
        var widgetList=panorama[widget.constructor.name.toLowerCase()];

        if (widgetList._active==widget) {
          widgetList._active=null;
        }

        if (widgetList._hover==widget) {
          widgetList._hover=null;
        }

        $.each(widgetList.hover,function(index){
          if (this.object && this.object.parent.name==widget.name) {
            widgetList.hover.splice(index,1);
          }
        });

        if (widgetList.list[widget.name]) {
          widgetList.list[widget.name].instance=null;
          delete(widgetList.list[widget.name]);
        }

        widgetList.mesh_list_update();

        if (widget.object3D) {
          widget.scene.remove(widget.object3D);
          widget.object3D=null;
        }

        if (typeof(widget.mesh)=="object") {
          widget.mesh=null;
        }

        $(document).off('.'+Widget.name.toLowerCase()+'_widget_mousedown');

        widget.callback('dispose');

      }, // widget_remove


      // callback other classes can hook to
      callback: function widget_callback(widget_event) {
        var widget=this;
        if (typeof(widget_event)=='string') {
          widget_event={
            type: widget_event,
            target: widget
          }
        }
        if (widget['on'+widget_event.type]) {
          return widget['on'+widget_event.type](widget_event);
        }
      }, // widget_callback

      onready: function widget_ready(widget_event) {
        var widget=this;
        widget.object3D.name=widget.name;
        $.each(widget.object3D.children,function(index,mesh){
            widget.camera.meshes[widget.constructor.name.toLowerCase()].push(this);
        });
      }, // widget_ready

      // create default mesh
      defaultMesh: function widget_defaultMesh() {
         var widget=this;
         var circle=new THREE.Mesh(new THREE.CircleGeometry(widget.size,100), new THREE.MeshBasicMaterial({
               color: 0x000000,
               transparent: true,
               opacity: 0.3,
               depthWrite: false,
               depthTest: false
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
        widget.coords.vec4.applyMatrix4(widget.panorama.sphere.object3D.matrix);

    //    widget.coords.vec4.applyMatrix4(new THREE.Matrix4().makeRotationY(panorama.lon*Math.PI/180));
    //    widget.coords.vec4.applyMatrix4(new THREE.Matrix4().makeRotationX(panorama.lat*Math.PI/180));

        // set widget position
        widget.object3D.position.x=widget.coords.vec4.x/widget.coords.vec4.w;
        widget.object3D.position.y=widget.coords.vec4.y/widget.coords.vec4.w;
        widget.object3D.position.z=widget.coords.vec4.z/widget.coords.vec4.w;

        if (widget.lookAtVec3) widget.object3D.lookAt(widget.lookAtVec3);
    //    widget.object3D.rotation.setFromRotationMatrix(new THREE.Matrix4().makeRotationY(-panorama.lon*2*Math.PI/180));

        widget.callback('update');

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

      onmousein: function widget_mousein(e) {
        console.log('mousein',this);
      },

      onmouseout: function widget_mouseout(e) {
        console.log('mouseout',this);
      },

      onmouseover: function widget_mouseover(e) {
      },

      onmousedown: function widget_mousedown(e) {
        console.log('mousedown',this);
      },

      onmouseup: function widget_mouseup(e) {
        console.log('mouseup',this);
      },

      onclick: function widget_click(e) {
        console.log('click',this);
      },

      _onmousedown: function _widget_mousedown(e){

        var widget=this;
        var widgetList=widget.panorama[this.constructor.name.toLowerCase()];

        // set widget mode to active
        widgetList._active=widget;
        this.setColor(this.color.active);

        // restore widget color on mouseup
        $(document).on('mouseup.'+Widget.name.toLowerCase()+'_widget_mousedown',function(){
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
          $(document).off('mouseup.'+Widget.name.toLowerCase()+'_widget_mousedown');
        });

      }, // _widget_mousedown

      _onmouseup: function _widget_mouseup(e){
        var widget=this;
        var widgetList=widget.panorama[this.constructor.name.toLowerCase()];
        widget.setColor(this.color.hover);
        if (widgetList._active==widget){
          setTimeout(function(){
            widget.callback('click');
          },0);
        }
      }, // _widget_mouseup

      _onmousein: function _widget_mousein(e){

        var panorama=this.panorama;

        if (!this.color || panorama.mode.rotate) return;

        // find the active widget if any
        var activeWidget=null;
        $.each(window.widgetTypes,function(index,name){
          var widgetList=panorama[name.toLowerCase()];
          if (widgetList && widgetList._active) {
            activeWidget=widgetList._active;
            return false;
          }
        });

        var widgetList=panorama[this.constructor.name.toLowerCase()];
        widgetList._hover=this;

        // restore active color on mousein when mouse button is down
        if (activeWidget) {
          if (activeWidget==this) {
            this.setColor(this.color.active);
          }
          return;
        }

        // or set hover color
        this.setColor(this.color.hover);

      }, // _widget_mousein

      _onmouseout: function _widget_mouseout(e){
        if (!this.color || this.panorama.mode.rotate) return;
        this.panorama[this.constructor.name.toLowerCase()]._hover=null;
        this.setColor(this.color.normal);
      }, // _widget_mouseout

      setColor: function widget_setColor(color) {
        var widget=this;
        console.log('setColor',this,color);
        $.each(widget.object3D.children,function(){
          this.material.color.set(color);
        });
        widget.panorama.drawScene();
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

    $.extend(true, WidgetList.prototype, {

        defaults: {
          list: {}
        },

        // save pointer to Panorama.prototype.callback in WidgetList.prototype
        panorama_prototype_callback: Panorama.prototype.callback,

        // save pointer to Panorama.prototype.onmousedown in WidgetList.prototype
        panorama_prototype_onmousedown: Panorama.prototype.onmousedown,

        // initialize widget list and instantiate widgets
        init: function widgetList_init() {

          var widgetList=this;
          var panorama=widgetList.panorama;

          // setup secondary scene for overlay if requested
          if (widgetList.overlay) {
            if (!widgetList.camera) {
              widgetList.camera=panorama.camera;
            }
            if (!widgetList.scene) {
              widgetList.scene=new THREE.Scene();
            }
          }

          panorama[Widget.name.toLowerCase()]=widgetList;

          if (!widgetList.scene && !panorama.scene) {
            console.log('no scene is defined, cannot create widgets');
            return;
          }

          // instantiate widgets
          $.each(widgetList.list,function(name) {
            widgetList.instantiateWidget(name);
          });

        }, // widgetList_init

        instantiateWidget: function widgetList_instantiateWidget(name) {
            var widgetList=this;
            var panorama=widgetList.panorama;

            var widget=widgetList.list[name];
            widget.instance=null;

            // setup widget basic options
            var options=$.extend(
              true,
              {},
              widgetList.defaults,
              { scene: panorama.scene,
                camera: panorama.camera
              },
              { scene: widgetList.scene,
                camera: widgetList.camera
              },
              widget,
              { name: name,
                panorama: panorama,
              }
            );

            // setup mesh list and camera_list for raycaster
            if (!options.camera.meshes) {
              options.camera.meshes={};
            }
            if (!options.camera.meshes[Widget.name.toLowerCase()]) {
              options.camera.meshes[Widget.name.toLowerCase()]=[];
            }

            if (!options.camera._id ) options.camera._id=[];
            if (!widgetList._cameraList) widgetList._cameraList=[];

            if (options.camera._id[Widget.name]==undefined) {

              // register camera in widgetList._cameraList
              options.camera._id[Widget.name]=widgetList._cameraList.length;
              widgetList._cameraList.push(options.camera);

              // setup raycaster for camera, for get_mouseover_list()
              if (!(options.camera.raycaster instanceof THREE.Raycaster)) {
                options.camera.raycaster=new THREE.Raycaster(options.raycaster);
              }
            }

            // instantiate widget
            widgetList.list[name].instance=new Widget(options);

        }, // widgetList_instantiateWidget

        add: function widgetList_add(list) {
          var widgetList=this;
          $.extend(true,widgetList.list,list);
          $.each(list,function(name){
            widgetList.instantiateWidget(name);
          });
        }, // widgetList_add

        // update mesh list used for get_mouseover_list
        mesh_list_update: function widgetList_mesh_list_update() {
          var widgetList=this;
          $.each(widgetList.list,function(name,widgetList_elem) {
            widgetList_elem.instance.camera.meshes[Widget.name.toLowerCase()]=[];
            return false; // all widgets from widgetList are of the same constructor
          });
          $.each(widgetList.list,function(name,widgetList_elem) {
            $.each(widgetList_elem.instance.object3D.children,function(index,mesh){
              widgetList_elem.instance.camera.meshes[Widget.name.toLowerCase()].push(this);
            });
          });
        }, // widgetList_mesh_list_update

        on_panorama_update: function widgetList_on_panorama_update(e) {

          var panorama=this;
          var widgetList=panorama[Widget.name.toLowerCase()];

          if (!(widgetList instanceof WidgetList)) {
            return;
          }

          // update widget list on panorama 'update' event
          $.each(widgetList.list,function widget_update() {
            var widgetList_elem=this;
            if (widgetList_elem.instance) {
              widgetList_elem.instance.update();
            }
          });

        }, // widgetList_on_panorama_update

        // render overlay scene
        on_panorama_render: function widgetList_on_panorama_render(e) {

          var panorama=this;
          var widgetList=panorama[Widget.name.toLowerCase()];

          if (!widgetList.overlay) return;
          if (!(widgetList instanceof WidgetList)) return;

          // render widgets over panorama scene
          panorama.renderer.clearDepth();
          panorama.renderer.render(widgetList.scene,widgetList.camera.instance);

        }, // widgetList_on_panorama_render

        // dispose widgets and empty widget list on panorama dispose
        on_panorama_dispose: function widgetList_on_panorama_dispose(e) {

          var panorama=this;
          var widgetList=panorama[Widget.name.toLowerCase()];

          if (!(widgetList instanceof WidgetList)) {
            return;
          }

          // remove widget objects from scene
          $.each(widgetList.list,function widgetList_widget_dispose() {
            var widget=this;
            if (widget.instance){
              widget.instance.remove()
              widget.instance=null;
            }
          });

          if (widgetList._cameraList) {
            $.each(widgetList._cameraList,function(){
              var camera=this;
              camera._id=null;
              camera.meshes=null;
              camera.raycaster=null;
            });
          }
          widgetList._cameraList=null;
          widgetList.camera=null;
          widgetList.scene=null;

          panorama[Widget.name.toLowerCase()]=null;

      }, // widgetList_on_panorama_dispose

      // instantiate or re-initialize widget list
      on_panorama_ready: function widgetList_on_panorama_ready(e) {

        var panorama=this;
        var widgetList=panorama[Widget.name.toLowerCase()];

        if (widgetList instanceof WidgetList) {
          widgetList.init();
        } else {
          widgetList=panorama[Widget.name.toLowerCase()]=new WidgetList($.extend(true,{
            panorama: panorama
          },widgetList));
        }

        widgetList.callback('ready');

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
          var widget=widgetList.list[hover_elem.object.parent.name].instance;

          // unless non-applicable or not requested for the related widget
          if (material.map && material.transparent && widget.handleTransparency) {

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
            panorama.renderer.render(widgetList.scene,widget.camera.instance,widgetList.renderTarget,true);

            // read pixel at mouse coordinates
            var pixel=new Uint8Array(4);
            var gl=panorama.renderer.getContext();
            gl.readPixels(e.pageX,widgetList.renderTarget.height-e.pageY,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);

            // put object back in main scene
            widget.scene.add(hover_elem.object.parent);

            // discard widget when pixel alpha channel is null
            if (!pixel[3]) return;

          }

          // add mesh to filtered list
          filtered_list.push(hover_elem);

        });

        return filtered_list;

      }, // widgetList_filterHoverList

      on_panorama_mousemove: function widgetList_on_panorama_mousemove(e) {

        var panorama=this;
        var widgetList=panorama[Widget.name.toLowerCase()];

        if (!(widgetList instanceof WidgetList)) {
          return;
        }

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
              widgetList.list[hover[0].object.parent.name].instance.onmouseover(e);
              return;

            } else {
              // not the same one, trigger mouseout and continue
              widgetList.list[widgetList.hover[0].object.parent.name].instance._onmouseout(e);
              widgetList.list[widgetList.hover[0].object.parent.name].instance.onmouseout(e);
            }
          }

          // store current hover list
          widgetList.hover=hover;

          // trigger mousein and mouseover for the widget mouse is hovering now
          widgetList.list[hover[0].object.parent.name].instance._onmousein(e);
          widgetList.list[hover[0].object.parent.name].instance.onmousein(e);
          widgetList.list[hover[0].object.parent.name].instance.onmouseover(e);

        } else {
          // no hover now, but if mouse was hovering a widget before
          if (widgetList.hover.length) {

              // trigger mouseout and return
              try {

                if (widgetList.list[widgetList.hover[0].object.parent.name] &&
                    widgetList.list[widgetList.hover[0].object.parent.name].instance) {
                      widgetList.list[widgetList.hover[0].object.parent.name].instance._onmouseout(e);
                      widgetList.list[widgetList.hover[0].object.parent.name].instance.onmouseout(e);
                }

              } catch(e) {
                console.log(e);
              }

              widgetList.hover=[];

              return;
          }
        }

      }, // widgetList_on_panorama_mousemove

      on_panorama_mouseevent: function widgetList_on_panorama_mousevent(e) {

        var panorama=this;
        var widgetList=panorama[Widget.name.toLowerCase()];

        if (!(widgetList instanceof WidgetList)) {
          return;
        }

        if (!widgetList.hover.length) {
          return;
        }

        // call handlers for first widget from hovering list
        var widget=widgetList.list[widgetList.hover[0].object.parent.name].instance;

        // 1. private mouseevent handler (for hover / active color handling)
        if (widget['_on'+e.type] && widget.color) {
          widget['_on'+e.type](e);
        }

        // 2. public mouseevent handler
          return widget['on'+e.type](e);

      }, // widgetList_on_panorama_mouseevent

      get_mouseover_list: function widgetList_get_mouseover_list(e) {

        var widgetList=this;
        var panorama=widgetList.panorama;
        var container=$(panorama.container);
        var mouseover_list=[];

        if (e.clientX==undefined) {
          return mouseover_list;
        }

        // convert screen coordinates to normalized coordinates
        var vector=new THREE.Vector3();
        vector.set(
          (e.clientX-container.offset().left)/container.width()*2-1,
         -(e.clientY-container.offset().top)/container.height()*2+1,
         0.5
        );

        // for each camera referenced by widgets in widgetList
        if (widgetList._cameraList) {
          $.each(widgetList._cameraList,function(idx,camera){

            // convert normalized coordinates to world coordinates
            var wc=vector.clone();
            wc.unproject(camera.instance);

            // create a ray from camera.position to world coordinates
            camera.raycaster.ray.set(camera.instance.position, wc.sub(camera.instance.position).normalize());

            // find meshes intersecting with this ray
            var meshes=camera.raycaster.intersectObjects(camera.meshes[Widget.name.toLowerCase()]);

            // and append them to mouseover_list
            if (meshes.length) {
              mouseover_list=mouseover_list.concat(meshes);
            }

          });
        }

        return mouseover_list;

      }, // widgetList_get_mouseover_list

      show: function widgetList_show(options) {

        var widgetList=this;

        if (typeof(options)=='string') {
          options={name: options};
        }

        var panorama=widgetList.panorama;
        var widget=widgetList.list[options.name];
        var dlon=(widget.coords.lon-panorama.lon+90)%360;
        var dlat=(widget.coords.lat-panorama.lat)%180;
        var dzoom=(widget.zoom)?widget.zoom-panorama.camera.zoom.current:0;
        if (Math.abs(dlon)>180) {
            dlon+=(dlon<0)?360:-360;
        }

        if (dlon==0 && dlat==0) return;

        panorama.mode.show=true;
        var it=0;

        var _drawScene=function(){
          ++it;
          panorama.lon+=dlon/30;
          panorama.lat+=dlat/30;
          panorama.camera.zoom.current+=dzoom/30;
          panorama.zoomUpdate();
          panorama.drawScene();
          if (it<30) requestAnimationFrame(_drawScene,null,30-it>>1);
          else {
            panorama.mode.show=false;
            widget.instance.callback('show');
          }
        };
        requestAnimationFrame(_drawScene);

      }, // widgetList_show

      callback: function widgetList_callback(widgetList_event) {
        var widgetList=this;
        if (typeof(widgetList_event)=='string') {
          widgetList_event={
            type: widgetList_event,
            target: widgetList
          }
        }
        if (widgetList['on'+widgetList_event.type]) {
          return widgetList['on'+widgetList_event.type](widgetList_event);
        }

      }, // widgetList_callback

      // setup widgetList_callback hook for specified instance or prototype
      setupCallback: function widgetList_setupCallback(obj) {

          obj.widgetList_prototype_callback=WidgetList.prototype.callback;

          obj.widgetList_callback=function(e) {
             var widgetList=this;
             if (typeof(e)=="string") {
               e={
                 type: e,
                 target: widgetList
               }
             }
             var method='on_'+widgetList.constructor.name.toLowerCase()+'_'+e.type;
             if (obj[method]) {
               if (obj[method].apply(widgetList,[e])===false) {
                  return false;
               }
             }
             return obj.widgetList_prototype_callback.apply(e.target,[e]);
          }

          WidgetList.prototype.callback=obj.widgetList_callback;

        } // widgetList_setupCallback

    }); // extend WidgetList.prototype

    $.extend(true,WidgetList.prototype,{
        on_panorama_mousedown: WidgetList.prototype.on_panorama_mouseevent,
        on_panorama_mouseup: WidgetList.prototype.on_panorama_mouseevent,

    }); // extend WidgetList.prototype

    $.extend(true,Panorama.prototype,{

      defaults: {
        renderer: {
          options: {
            preserveDrawingBuffer: true
          }
        }
      },

      // run the panorama event handler defined for widgetList, if any
      callback: function widgetList_panorama_prototype_callback(e) {

        var panorama=this;
        var widgetList=panorama[Widget.name.toLowerCase()];

        if (widgetList instanceof WidgetList){
          // widget list is yet instantiated
          if (widgetList['on_panorama_'+e.type]) {
            // forward panorama event to widget list
            if (widgetList['on_panorama_'+e.type].apply(panorama,[e])===false) {
              return false;
            }
          }
        } else {
          // widget list is not yet instantiated
          if (e.type=='ready'){
            // instantiate widget list on panorama_ready
            WidgetList.prototype.on_panorama_ready.apply(panorama,[e]);
          }
        }

        // chain with previous panorama.prototype.callback
        return WidgetList.prototype.panorama_prototype_callback.apply(panorama,[e]);

      }, // widgetList_panorama_prototype_callback

      // hook to Panorama.prototype.onmousedown
      onmousedown: function widgetList_panorama_prototype_onmousedown(e) {

        var panorama=this;

        // call previous panorama.prototype.callback
        var ret=WidgetList.prototype.panorama_prototype_onmousedown.apply(panorama,[e]);

        // unset panorama.mode.rotate when mousedown activated a widget
        if (panorama[Widget.name.toLowerCase()] && panorama[Widget.name.toLowerCase()]._active){
          panorama.mode.rotate=false;
        }

        return ret;

      }

    }); // extend Panorama.prototype

  })(root[widgetName+suffix[0]],root[widgetName+suffix[1]])

} // WidgetFactory

