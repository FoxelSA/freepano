
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
        size: 1,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.8,
        alphatest: 0.1
    }), // pointCloud.defaults.dotMaterial
    
    parseJSON: function parseJSON(json) {
      var positions = new Float32Array(json.points.length * 3);
      var i=0;
      console.log('parsing cloud... ('+json.points.length+' points)');
      json.points.forEach(function(point,index) {
        positions[i]=point[0];
        positions[i+1]=point[1];
        positions[i+2]=point[2];
        i+=3;
      });
      console.log('parsing cloud... done');
      return positions;
    }, // pointCloud.defaults.parseJSON

    sortParticles: true

  }, // pointCloud.prototype.defaults

  init: function pointCloud_init(){
    var pointCloud=this;

    if (pointCloud.url) {
      pointCloud.load(pointCloud.url);

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
    pointCloud.object3D.rotation.copy(panorama.sphere.object3D.rotation);
    panorama.drawScene();
  
  }, // pointCloud_onload

  onloaderror: function pointCloud_onloaderror(e) {
    throw e;
  },

  on_panorama_ready: function pointCloud_on_panorama_ready(e) {

    var panorama=this;

    var pointCloud=panorama.pointCloud.instance=new PointCloud($.extend(true,{},panorama.pointCloud,{
      panorama: panorama,
      url: panorama.sphere.texture.dirName.replace(/\/pyramid\/.*/,'/pointcloud/')+p.list.currentImage+'-freepano.json'
    }));

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
           target: pointCloud
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
