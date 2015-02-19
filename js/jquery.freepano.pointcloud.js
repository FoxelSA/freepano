
function PointCloud(options) {
  if (!(this instanceof PointCloud)) {
    return new PointCloud(options);
  }
  $.extend(true,this,{},this.defaults,options);
  this.init();
}

$.extend(true,PointCloud.prototype,{

  defaults: {
    dotMaterial: new THREE.PointCloudMaterial({
//        map: THREE.ImageUtils.loadTexture(),
        size: 2,
        color: 'yellow',
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.8,
        alphatest: 0.1
    }), // pointCloud.defaults.dotMaterial
    
    parseJSON: function parseJSON(json) {
      var pointCloud=this;
      var panorama=pointCloud.panorama;
      var positions = new Float32Array(json.points.length * 3);
      var i=0;
      console.log('parsing cloud... ('+json.points.length+' points)');
      var v=new THREE.Vector3();
      var Xaxis=new THREE.Vector3(1,0,0);
      var Yaxis=new THREE.Vector3(0,1,0);
      json.points.forEach(function(point,index) {
        v.x=0;
        v.y=0;
        v.z=panorama.sphere.radius;
        v.applyAxisAngle(Xaxis,point[1]);
        v.applyAxisAngle(Yaxis,point[0]);
        positions[i]=-v.x
        positions[i+1]=v.y
        positions[i+2]=v.z
        i+=3;
      });
      console.log('parsing cloud... done');
      return positions;
    }, // pointCloud.defaults.parseJSON

    sortParticles: true,

    raycaster: {
      threshold: 0.01
    }

  }, // pointCloud.prototype.defaults

  init: function pointCloud_init(){
    var pointCloud=this;

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
      pointCloud.load(pointCloud.url);

    // load json if any
    } else if (pointCloud.json) {
      pointCloud.fromJSON(pointCloud.json);
    }

  }, // pointCloud_init

  onerror: function pointCloud_onerror(error) {
    alert(error.msg);

  }, // pointCloud_onerror

  load: function pointCloud_load(url) {

    var pointCloud=this;
    pointCloud.url=url;

    $.ajax({

      url: pointCloud.url,

      error: function() {
        pointCloud.callback('loaderror',Array.prototype.slice.call(arguments));
      }, // error

      success: function(json){
        if (!json.points) {
          pointCloud.callback('loaderror',Array.prototype.slice.call(arguments));
          return;
        }

        pointCloud.fromJSON(json);

        pointCloud.callback('load');

      } // success

    });  // ajax
    
  }, // pointCloud_load

  fromJSON: function pointCloud_fromJSON(json){

    var pointCloud=this;

    pointCloud.json=json;
    pointCloud.geometry=new THREE.BufferGeometry();
     
    var positions=pointCloud.parseJSON(json);

    pointCloud.geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3)); 
     
    pointCloud.object3D=new THREE.PointCloud(pointCloud.geometry,pointCloud.dotMaterial);
    pointCloud.object3D.sortParticles=pointCloud.sortParticles;

  }, // pointCloud_fromJSON

  onload: function pointCloud_onload(e) {
    var pointCloud=this;
    var panorama=pointCloud.panorama;
    panorama.scene.add(pointCloud.object3D);
    panorama.drawScene();
  
  }, // pointCloud_onload

  onloaderror: function pointCloud_onloaderror(e) {
    throw e;
  },

  on_panorama_mousemove: function pointCloud_on_panorama_mousemove(e){
    var panorama=this;
    var pointCloud=panorama.pointCloud;

    if (!pointCloud || !pointCloud.instance || pointCloud.active===false || !pointCloud.instance.object3D || !pointCloud.instance.object3D.visible) {
      return;
    }

    var raycaster=pointCloud.instance.raycaster;

    var canvas=panorama.renderer.domElement;
    var offset=$(canvas).offset();
    var mouse={
      x: ((e.clientX-offset.left) / canvas.width) * 2 - 1,
      y: -((e.clientY-offset.top) / canvas.height) * 2 + 1
    }


    raycaster.instance.setFromCamera(mouse,panorama.camera.instance);
    var intersections=raycaster.instance.intersectObject(pointCloud.instance.object3D);
    if (intersections.length) {
      var point=pointCloud.hover=intersections[0];
      console.log(pointCloud.hover);
    }

  }, // pointCloud_on_panorama_render

  on_panorama_ready: function pointCloud_on_panorama_ready(e) {

    var panorama=this;

    if (panorama.pointCloud && panorama.pointCloud.active!==false) {
      var pointCloud=panorama.pointCloud.instance=new PointCloud($.extend(true,{},panorama.pointCloud,{
        panorama: panorama,
        url: panorama.sphere.texture.dirName.replace(/\/pyramid\/.*/,'/pointcloud/')+p.list.currentImage+'-freepano.json'
      }));
    }

  }, // pointCloud_on_panorama_ready

  on_panorama_dispose: function pointCloud_on_panorama_dispose(e) {
    var panorama=this;
    if (panorama.pointCloud && panorama.pointCloud.instance) {
      panorama.scene.remove(panorama.pointCloud.instance.object3D);
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
