/*
 * freepano - WebGL panorama viewer
 *
 * Copyright (c) 2014,2015 FOXEL SA - http://foxel.ch
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
        coords: {
          lon: 0,
          lat: 90
        },
        size: Math.PI/9,
        handleTransparency: true,
        lookAtVec3: new THREE.Vector3(0,0,0)
      },

      // initialize widget and add to panorama scene
      init: function widget_init() {

        var widget=this;

        widget.dispatch('preinit');

        var panorama=widget.panorama;

        widget.radius=widget.radius||panorama.sphere.radius;

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

        // set widget position
        widget.updatePosition();

        // trigger widget 'ready' callback
        widget.dispatch('ready');

      }, // widget_init

      updatePosition: function widget_updatePosition(){
        var widget=this;

        // compute widget position
        var phi=-widget.coords.lon*Math.PI/180;
        var theta=widget.coords.lat*Math.PI/180;
        var pos=new THREE.Vector3(0,0,-1);
        pos.applyAxisAngle(new THREE.Vector3(1,0,0),theta);
        pos.applyAxisAngle(new THREE.Vector3(0,1,0),phi);
        pos.multiplyScalar(widget.radius);

        // set widget position
        widget.object3D.position.copy(pos);

        if (widget.lookAtVec3) widget.object3D.lookAt(widget.lookAtVec3);

      }, // widget_updatePosition

      setCoords: function widget_setCoords(coords){
        var widget=this;

        widget.coords.lon=coords.lon;
        widget.coords.lat=coords.lat;
        widget.updatePosition();

      }, // widget_setCoords

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

        widget.dispatch('dispose');

      }, // widget_remove

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

    //    widget.object3D.rotation.setFromRotationMatrix(new THREE.Matrix4().makeRotationY(-panorama.lon*2*Math.PI/180));

        widget.dispatch('update');

      }, // widget_update

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
        var widget=this;
        var widgetList=widget.panorama[this.constructor.name.toLowerCase()];
        // todo: handle multiple selection, with shift and ctrl modifiers
        if (widget.color && widget.color.selected) {
          if (!widget.selected){
            widget.selected=true;
            widget.setColor(widget.color.selected);
            $.each(widgetList.list,function(name){
              var _widget=this.instance;
              if (_widget.selected && _widget!=widget){
                _widget.selected=false;
                _widget.setColor(_widget.color.normal)
                _widget.dispatch('unselect');
              }
            });
            widget.dispatch('select');
          }
        }
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
              widget.setColor(widget.selected?widget.color.selected:widget.color.normal);
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
            widget.dispatch('click');
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
        var widget=this;
        if (!widget.color || widget.panorama.mode.rotate) return;
        widget.panorama[widget.constructor.name.toLowerCase()]._hover=null;
        widget.setColor(widget.selected?widget.color.selected:widget.color.normal);
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

          widgetList.dispatch('preinit');

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
              widgetList.defaults[widgetList.constructor.name.split('_')[0].toLowerCase()], // ugly
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
            if (widgetList_elem.instance.camera.meshes) {
              widgetList_elem.instance.camera.meshes[Widget.name.toLowerCase()]=[];
              return false; // all widgets from widgetList are of the same constructor
            }
          });

          $.each(widgetList.list,function(name,widgetList_elem) {

            var meshes=widgetList_elem.instance.camera.meshes;

            if (meshes && meshes[Widget.name.toLowerCase()]) {
              $.each(widgetList_elem.instance.object3D.children,function(index,mesh){
                meshes[Widget.name.toLowerCase()].push(this);
              });
            }

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

          if (!(widgetList instanceof WidgetList)) return;
          if (!widgetList.overlay) return;

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

        widgetList.dispatch('ready');

      }, // widgetList_on_panorama_ready

      hover: [],

      // for the hover_list candidates, return those for whom the given pixel is not totally transparent
      filterHoverList: function widgetList_filterHoverList(e,hover_list) {
        var widgetList=this;
        var panorama=widgetList.panorama;
        var filtered_list=[];
        var canvas=panorama.renderer.getContext().canvas;
        panorama.renderer.autoClear=true;

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
        panorama.renderer.autoClear=false;

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

      show: function widgetList_show(options,callback) {

        var widgetList=this;
        var panorama=widgetList.panorama;

        if (panorama.mode.show) {
          return;
        }

        if (typeof(options)=='string') {
          options={
            name: options,
            callback: callback
          };
        }

        var widget=widgetList.list[options.name];
        var dlon=(widget.coords.lon-panorama.lon)%360;
        var dlat=(widget.coords.lat-panorama.lat)%180;
        var dzoom=(widget.zoom)?widget.zoom-panorama.camera.zoom.current:0;
        if (Math.abs(dlon)>180) {
            dlon+=(dlon<0)?360:-360;
        }

        if (dlon==0 && dlat==0) {
          if (typeof(options.callback=="function")){
            callback(widget);
          }
          return;
        }

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
            widget.instance.dispatch('show');
            if (typeof(options.callback=="function")){
              setTimeout(function(){
                callback(widget);
              },150);
            }
          }
        };
        requestAnimationFrame(_drawScene);

      }, // widgetList_show

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

    setupEventDispatcher(WidgetList.prototype);
    setupEventDispatcher(Widget.prototype);
    Panorama.prototype.dispatchEventsTo(WidgetList.prototype);

  })(root[widgetName+suffix[0]],root[widgetName+suffix[1]])

} // WidgetFactory

