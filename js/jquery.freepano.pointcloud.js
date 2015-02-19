
function PointCloud(options) {
  if (!(this instanceof PointCloud)) {
    return new PointCloud(options);
  }
  $.extend(true,this,{},this.defaults,options);
  this.init();
}

$.extend(true,PointCloud.prototype,{

  defaults: {

    overlay: true,

    // paramaeters for converting panorama url to pointcloud json url
    urlReplace: {
      replaceThis: new RegExp(/\/pyramid\/.*/),
      replaceWithThis: '/pointcloud/',
      suffix: '-freepano.json'
    },

    // point cloud dot material
    dotMaterial: new THREE.PointCloudMaterial({
//        map: THREE.ImageUtils.loadTexture(),
        size: 2,
        color: 'yellow',
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.8,
        alphatest: 0.1
    }), // pointCloud.defaults.dotMaterial
   
   // generate positions array from json 
    parseJSON: function parseJSON(json) {

      var pointCloud=this;
      var panorama=pointCloud.panorama;

      var positions = new Float32Array(json.points.length * 3);

      var v=new THREE.Vector3();
      var Xaxis=new THREE.Vector3(1,0,0);
      var Yaxis=new THREE.Vector3(0,1,0);

      console.log('parsing cloud... ('+json.points.length+' points)');
      var i=0;

      // for each point defined in the json
      json.points.forEach(function(point,index) {

        // initialize vector at z = sphere radius
        v.x=0;
        v.y=0;
        v.z=panorama.sphere.radius;

        // apply rotations
        v.applyAxisAngle(Xaxis,point[1]);
        v.applyAxisAngle(Yaxis,point[0]);

        // store position
        positions[i]=-v.x
        positions[i+1]=v.y
        positions[i+2]=v.z
        i+=3;

      });
      console.log('parsing cloud... done');

      return positions;

    }, // pointCloud.defaults.parseJSON

    // sort point cloud particles by depth
    sortParticles: false,

    // raycaster options
    raycaster: {
      threshold: 0.01
    }

  }, // pointCloud.prototype.defaults

  init: function pointCloud_init(){
    var pointCloud=this;

    if (pointCloud.overlay) {
      pointCloud.scene=new THREE.Scene();
    }

    // init raycaster
    if (!(pointCloud.raycaster instanceof THREE.Raycaster)) {
      if (pointCloud.raycaster && pointCloud.raycaster.instance) {
        delete pointCloud.raycaster.instance;
      }
      pointCloud.raycaster.instance=new THREE.Raycaster(pointCloud.raycaster.options);
      pointCloud.raycaster.instance.params.PointCloud.threshold=pointCloud.raycaster.threshold||0.01;
    }

    // load url if any
    if (pointCloud.url) {
      pointCloud.fromURL(pointCloud.url);

    // load json if any
    } else if (pointCloud.json) {
      pointCloud.fromJSON(pointCloud.json);
    }

  }, // pointCloud_init

  onerror: function pointCloud_onerror(error) {
    alert(error.msg);

  }, // pointCloud_onerror

  // load point cloud json from url
  fromURL: function pointCloud_fromURL(url) {

    var pointCloud=this;
    pointCloud.url=url;

    $.ajax({

      url: pointCloud.url,

      error: function() {
        // trigger pointcloud 'loaderror' event
        pointCloud.callback('loaderror',Array.prototype.slice.call(arguments));
      }, // error

      success: function(json){

        // no data available ?
        if (!json.points) {
          // trigger pointcloud 'loaderror' event
          pointCloud.callback('loaderror',Array.prototype.slice.call(arguments));
          return;
        }

        // parse point cloud json
        pointCloud.fromJSON(json);

        // trigger pointcloud 'load' event
        pointCloud.callback('load');

      } // success

    });  // ajax
    
  }, // pointCloud_fromURL

  // load point cloud from json
  fromJSON: function pointCloud_fromJSON(json){

    var pointCloud=this;

    // keep json reference
    pointCloud.json=json;

    // instantiate point cloud geometry
    pointCloud.geometry=new THREE.BufferGeometry();
    
    // extract particles positions from JSON 
    var positions=pointCloud.parseJSON(json);

    // add particles to geometry
    pointCloud.geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3)); 
    
    // instantiate object3D 
    pointCloud.object3D=new THREE.PointCloud(pointCloud.geometry,pointCloud.dotMaterial);
    pointCloud.object3D.sortParticles=pointCloud.sortParticles;

  }, // pointCloud_fromJSON

  // pointcloud 'load' event handler
  onload: function pointCloud_onload(e) {

    var pointCloud=this;
    var panorama=pointCloud.panorama;

    // add pointcloud to scene
    var scene=(pointCloud.overlay)?pointCloud.scene:panorama.scene;
    scene.add(pointCloud.object3D);

    panorama.drawScene();
  
  }, // pointCloud_onload

  // pointcloud 'loaderror' event handler
  onloaderror: function pointCloud_onloaderror(e) {
    throw e;
  }, // onloaderror

  // render pointcloud overlay on "panorama render" event
  on_panorama_render: function pointCloud_on_panorama_render(){

    var panorama=this;
    var pointCloud=panorama.pointCloud.instance;

    if (pointCloud.overlay) {
      panorama.renderer.clearDepth();
      panorama.renderer.render(pointCloud.scene,panorama.camera.instance);  
    }

  }, // on_panorama_render

  // trigger pointcloud 'mouseover' event on particle mouseover
  on_panorama_mousemove: function pointCloud_on_panorama_mousemove(e){

    var panorama=this;
    var pointCloud=panorama.pointCloud;

    if (
      !pointCloud ||
      !pointCloud.instance ||
      pointCloud.active===false ||
      !pointCloud.instance.object3D ||
      !pointCloud.instance.object3D.visible
    ) {
      return;
    }

    // compute mouse normalized coordinates
    var canvas=panorama.renderer.domElement;
    var offset=$(canvas).offset();
    var mouse={
      x: ((e.clientX-offset.left) / canvas.width) * 2 - 1,
      y: -((e.clientY-offset.top) / canvas.height) * 2 + 1
    }

    // setup raycaster
    var raycaster=pointCloud.instance.raycaster;
    raycaster.instance.setFromCamera(mouse,panorama.camera.instance);

    // get intersection list
    var intersections=raycaster.instance.intersectObject(pointCloud.instance.object3D);

    // trigger pointcloud mouseover event
    if (intersections.length) {
      var point=pointCloud.hover=intersections[0];
      pointCloud.callback({
          type: 'mouseover',
          target: intersections
      });
    }

  }, // pointCloud_on_panorama_render

  // instantiate point cloud on panorama_ready
  on_panorama_ready: function pointCloud_on_panorama_ready(e) {

    var panorama=this;

    if (panorama.pointCloud && panorama.pointCloud.active!==false) {

      // get panorama url to pointcloud url conversion details
      var urlReplace=panorama.pointCloud.urlReplace||PointCloud.prototype.defaults.urlReplace;
      var replaceThis=urlReplace.replaceThis;
      var replaceWithThis=urlReplace.replaceWithThis;
      var suffix=urlReplace.suffix;

      // instantiate pointcloud
      var pointCloud=panorama.pointCloud.instance=new PointCloud($.extend(true,{},panorama.pointCloud,{
        panorama: panorama,
        url: panorama.sphere.texture.dirName.replace(replaceThis,replaceWithThis)+p.list.currentImage+suffix
      }));
    }

  }, // pointCloud_on_panorama_ready

  // dispose pointcloud on panorama dispose
  on_panorama_dispose: function pointCloud_on_panorama_dispose(e) {
    var panorama=this;
    if (panorama.pointCloud && panorama.pointCloud.instance) {
      var scene=(panorama.pointCloud.instance.overlay)?panorama.pointCloud.instance.scene:panorama.scene;
      scene.remove(panorama.pointCloud.instance.object3D);
      delete panorama.pointCloud.instance;
    }
  }, // pointCloud_on_panorama_dispose

  // asynchronous callback external methods can hook to using setupCallback below
  callback: function pointCloud_callback(e){
    var pointCloud=this;
    if (typeof(e)=='string') {
      e={
        target: pointCloud,
        type: e,
        args: Array.prototype.slice.call(arguments).slice(1)
      };
    }
    var method='on'+e.type;
    if (pointCloud[method]) {
      pointCloud[method].apply(pointCloud,[e]);
    }
  }, // pointCloud_callback
   
  // setup pointCloud_callback hook for specified instance or prototype
  setupCallback: function pointCloud_setupCallback(obj) {
   
    obj.pointCloud_prototype_callback=PointCloud.prototype.callback;
   
    obj.pointCloud_callback=function(e) {
       var pointCloud=this;
       if (typeof(e)=="string") {
         e={
           type: e,
           target: pointCloud,
           args: Array.prototype.slice.call(arguments).slice(1)
         }
       }
       if (obj['on_pointcloud_'+e.type]) {
         if (obj['on_pointcloud_'+e.type].apply(pointCloud,[e])===false) {
            return false;
         }
       }
       return obj.pointcloud_prototype_callback.apply(e.target,[e]);
    }
   
    PointCloud.prototype.callback=obj.pointcloud_callback;
   
  } // pointcloud_setupCallback


});

Panorama.prototype.setupCallback(PointCloud.prototype);
