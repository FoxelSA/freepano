
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
        map: THREE.ImageUtils.loadTexture('img/dot.png'),
        size: 0.15,
        color: 'yellow',
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8,
        alphaTest: 0.1,
        depthTest: false,
        depthWrite: false
    }), // pointCloud.defaults.dotMaterial
   
   // generate particle positions array from json 
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
        v.z=1;

        // apply rotations
        v.applyAxisAngle(Xaxis,point[1]);
        v.applyAxisAngle(Yaxis,point[0]);

        // store position
        positions[i]=-v.x*point[2];
        positions[i+1]=v.y*point[2];
        positions[i+2]=v.z*point[2];
        i+=3;

      });
      console.log('parsing cloud... done');

      return positions;

    }, // pointCloud.defaults.parseJSON

    // sort point cloud particles by depth
    sortParticles: true,

    // raycaster options
    raycaster: {
      threshold: 0.5 
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
      pointCloud.instance.callback({
          type: 'mouseover',
          target: intersections,
          originalEvent: e
      });
    }

  }, // pointCloud_on_panorama_render

  // snap to nearest intersecting particle
  onmouseover: function on_pointcloud_mouseover(e){

    var pointCloud=this;
    var panorama=pointCloud.panorama;
    var particle_list=e.target;

    panorama.getMouseCoords(e.originalEvent);
    var hover=pointCloud.nearestParticle(panorama.mouseCoords,particle_list);

    var material;
    var cursor=pointCloud.cursor;

    if (!cursor) {
      cursor=pointCloud.cursor={
        material: new THREE.SpriteMaterial({
          map: THREE.ImageUtils.loadTexture('img/dot_hover.png'),
          depthTest: false,
          depthWrite: false

        }),
        geometry: new THREE.Geometry()
      }
      cursor.sprite=new THREE.Sprite(cursor.material);
      pointCloud.scene.add(cursor.sprite);
    }

    cursor.sprite.position.copy(new THREE.Vector3().copy(pointCloud.getParticlePosition(hover.index)).normalize().multiplyScalar(10));
    var scale=0.1/p.getZoom();
    cursor.sprite.scale.set(scale,scale,scale);
    pointCloud.showParticleInfo(hover.index);

    pointCloud.panorama.drawScene();

  }, // pointCloud_onmouseover

  // return particle with least square distance from coords in radians
  nearestParticle: function pointCloud_nearestParticle(coords,particle_list) {
    var pointCloud=this;
    var panorama=pointCloud.panorama;
    var candidate=0;
    var d2min=999;
    var point_list=pointCloud.json.points;

    $.each(particle_list,function(i){

      var point=point_list[this.index];

      // compute absolute angle difference
      var dthe=Math.abs(point[0]-panorama.mouseCoords.theta);
      var dphi=Math.abs(point[1]+panorama.mouseCoords.phi);

      // adjust delta when crossing boundaries
      // (assume distance is less than half image)
      if (dthe>Math.PI) dthe=Math.PI*2-dthe;
      if (dphi>Math.PI/2) dphi=Math.PI-dphi;

      // select least square distance
      var dsquare=dthe*dthe+dphi*dphi;
      if (dsquare<d2min) {
        d2min=dsquare;
        candidate=i;

      // select nearest point on z axis when equidistant from cursor
      } else if (dsquare==d2min) {
        if (point_list[candidate].point[2]>point[2]) {
          candidate=i;
        }
      }

    });

    return particle_list[candidate];

  }, // pointCloud_nearestParticle

  // return particle world coordinates
  getParticlePosition: function pointCloud_getParticlePosition(index) {
    var pointCloud=this;
    var point=pointCloud.json.points[index];

    // initialize vector
    var v=new THREE.Vector3(0,0,1);

    // apply rotations
    v.applyAxisAngle(Xaxis,point[1]);
    v.applyAxisAngle(Yaxis,point[0]);

    // return positions
    return {
      x: -v.x*point[2],
      y: v.y*point[2],
      z: v.z*point[2]
    }
  }, // pointCloud_getParticlePosition

  showParticleInfo: function pointCloud_showParticleInfo(index) {
    var pointCloud=this;
    var point=pointCloud.json.points[index];
    var panorama=pointCloud.panorama;

    var div = $('#particleInfo');
    if (!div.length) {
        div = $('<div id="particleInfo">').appendTo(panorama.container).css({
            position: 'absolute',
            top: 0,
            left: 0,
            width: 128,
            backgroundColor: "rgba(0,0,0,.4)",
            color: 'white'
        });
    }

    var html = '<div style="width: 100%; position: relative; margin-left: 10px;">';
    html += '<strong>Particle info</strong><br />';
    html += 'theta: ' + point[0].toPrecision(6) + '<br />';
    html += 'phi: ' + point[1].toPrecision(6) + '<br />';
    html += 'distance: ' + point[2].toPrecision(6) + '<br />';
    html += 'index: ' + point[3] + '<br />';
    div.html(html);

  }, // pointCloud_showParticleInfo

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
