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

function PointCloud(options) {
  if (!(this instanceof PointCloud)) {
    return new PointCloud(options);
  }
  $.extend(true,this,{},this.defaults,options);
  this.init();
}

$.extend(true,PointCloud.prototype,{

  defaults: {

    enableParticleEvents: true,

    showParticleCursor: true,

    overlay: true,

    // paramaeters for converting panorama url to pointcloud json url
    urlReplace: {
      replaceThis: new RegExp(/\/pyramid\/.*/),
      replaceWithThis: '/pointcloud/',
      suffix: [ '.json' ]
    },
/*
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
  */

    // sort point cloud particles by depth
    sortParticles: false,

    // raycaster options
    raycaster: {
      threshold: 0.5
    }

  }, // pointCloud.prototype.defaults

  init: function pointCloud_init(){
    var pointCloud=this;

    if (!pointCloud.object3D) {
      pointCloud.object3D=new THREE.Object3D();
    }    

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

    // trigger pointCloud 'init' event
    pointCloud.dispatch('init');

  }, // pointCloud_init

  // load point cloud json from url
  fromURL: function pointCloud_fromURL(url) {

    var pointCloud=this;

    var mt=new Multithread();

    pointCloud.url=url;

    console.log('loading pointCloud from URL');


    var ajax=function ajax(request) {

      try {
        var xhr=new XMLHttpRequest();

        // setup event handlers
        var event_type=['progress','load','error','abort];
        for (handlerType in event_type) {
          if (request[handler_type]) {
            xhr.addEventListener(handler_type,request[handler_type],false);
          }
        }

        // open asynchronous GET request by default 
        xhr.open(request.type||'GET',request.url,request.async!=undefined?request.async:true);
        if (request.type=='POST') {
          xhr.setRequestHeader("Content-type",request.contentType||"application/x-www-form-urlencoded");
        }

        // set default response type to arraybuffer
        xhr.overrideMimeType(request.mimeType||'text/plain; charset=x-user-defined');
        xhr.responseType = request.dataType || 'arraybuffer';

        // send request
        xhr.send(request.data);
      
      } catch(e) {
        console.log(e);
        if (request.error) {
          request.error(e,xhr);
        } 
      }

    } // ajax

/* 
        // generate particle positions array from json
        worker.parseJSON=function worker_parseJSON(json) {

          // create empty sections
          var section=[];
          for(var x=0; x<360; ++x) {
            section[x]=[];
            for(var y=0; y<180; ++y) {
              section[x][y]=[];
            }
          }

//          switch(pointCloud.urlReplace.suffix[pointCloud.type]) {
//            case '.json':

              // use single object3D for point cloud ?
//              if (pointCloud.allInOne) {
                // allocate new array
//                pointCloud.positions = new Float32Array(json.points.length * 3);

//              }

              var field_count=json.points_format.length;
              console.log('Parsing point cloud... ('+(json.points.length/field_count)+' points)');

              // set pointcloud field offset
              var offset={};
              json.points_format.forEach(function(value,i){
                offset[value]=i;
              });

              // setup progress bar
//              pointCloud.progressBar=new pointCloud.ProgressBar({
//                css: {
//                  zIndex: 9999999,
//                  width: '100%',
//                  bottom: 0,
//                  position: 'absolute'
//                }
//              });
          var offset_phi=offset.phi;
          var offset_theta=offset.theta;
          var offset_depth=offset.depth;
          var points=json.points;
          var step=Math.PI/180;

          var v=new THREE.Vector3();

          for (var k=0; k<points.length; k+=field_count) {

            var phi=points[k+offset_phi];
            var theta=points[k+offset_theta];
            var depth=points[k+offset_depth];

            // store particle index where it belongs
            var x=Math.round(theta/step)%360;
            var y=Math.round(phi/step);

            if (y<0) {
              y+=180;
            }

            section[x][y].push(k/field_count);
*//*
            if (pointCloud.allInOne) {
              // unit vector
              v.x=0;
              v.y=0;
              v.z=1;

              // apply rotations
              v.applyAxisAngle(panorama.Xaxis,phi);
              v.applyAxisAngle(panorama.Yaxis,theta);

              // store position
              positions[i]=-v.x*depth;
              positions[i+1]=v.y*depth;
              positions[i+2]=v.z*depth;
              i+=3;
            }
*//*


//            pointCloud.progressBar.set(k/json.points.length);
          }

          console.log('Parsing point cloud... done');
          pointCloud.progressBar.elem.remove();
          worker.postMessage({
            type: 'section',
            section: section
          });

        }, // worker_parseJSON

          */
        
        var loadData=function(dataType,url) {

          ajax({

            url: url,
            responseType: 'arraybuffer',
            mimeType: 'text/plain; charset=x-user-defined',
            async: true,

            error: function() {
              console.log('loading data from '+url+'... failed');
              // trigger pointcloud 'loaderror' event
              pointCloud.dispatch({
                type: 'loaderror',
                dataType: dataType,
                url: url,
                arguments: Array.prototype.slice.call(arguments)
              });
            }, // error

            load: function(arrayBuffer){

              // failed ?, trigger pointcloud 'loaderror' event
              if (!arrayBuffer || !buffer.byteLength) {
                console.log('loading data from '+url+'... failed');
                pointCloud.dispatch({
                  type: 'loaderror',
                  dataType: dataType,
                  url: url,
                  arguments: Array.prototype.slice.call(arguments)
                });
                return;
              }

              // success
              console.log('loading data from '+url+'... done');
              pointCloud.trigger({
                type: 'load',
                dataType: dataType,
                url: url,
                buffer: arrayBuffer
              });

            } // load

          }); // ajax

        } // loadData

        // load sections.bin
        loadData('sections',url.replace(/.json$/,'_sections.bin'));
        loadData('positions',url.replace(/.json$/,'_positions.bin'));
      }

    });

  }, // pointCloud_fromURL

/*
  // load point cloud from json
  fromJSON: function pointCloud_fromJSON(json){

    var pointCloud=this;

    // keep json reference
    pointCloud.json=json;

    // extract particles positions from JSON
    pointCloud.parseJSON(json);

    if (pointCloud.allInOne) {
     // instantiate point cloud geometry
      pointCloud.geometry=new THREE.BufferGeometry();

      // add particles to geometry
      pointCloud.geometry.addAttribute('position', new THREE.BufferAttribute(pointCloud.positions, 3));

      // instantiate object3D
      var dotMaterial=pointCloud.dotMaterial.clone();
      dotMaterial.color.set('red');
      pointCloud._object3D=new THREE.PointCloud(pointCloud.geometry,pointCloud.dotMaterial.clone());
      pointCloud._object3D.sortParticles=pointCloud.sortParticles;

      pointCloud.scene.add(pointCloud._object3D);
    }

  }, // pointCloud_fromJSON

 // generate particle positions array from json
  parseJSON: function pointCloud_parseJSON(json) {
    var pointCloud=this;
    var panorama=pointCloud.panorama;

    // create empty sections
    var section=pointCloud.section=[];
    for(var x=0; x<360; ++x) {
      section[x]=[];
      for(var y=0; y<180; ++y) {
        section[x][y]=[];
      }
    }
    
    switch(pointCloud.urlReplace.suffix[pointCloud.type]) {
      case '.json':

        // use single object3D for point cloud ?
        if (pointCloud.allInOne) {
          // allocate new array
          pointCloud.positions = new Float32Array(json.points.length * 3);

        }
        
        var field_count=json.points_format.length;
        console.log('Parsing point cloud... ('+(json.points.length/field_count)+' points)');

        // set pointcloud field offset
        pointCloud.offset={};
        $.each(json.points_format,function(i,value){
          pointCloud.offset[value]=i;
        });

        // setup progress bar
        pointCloud.progressBar=new pointCloud.ProgressBar({
          css: {
            zIndex: 9999999,
            width: '100%',
            bottom: 0,
            position: 'absolute'
          }
        });

        // start asynchronous loop (to allow progressBar update)
        setTimeout(function(){
          pointCloud.parseJSONchunk(json,0)
        },0);
     
        break;
    }

  }, // pointCloud_parseJSON

  parseJSONchunk: function pointCloud_parseJSONchunk(json,kk) {

    var pointCloud=this;
    var section=pointCloud.section;
    var positions=pointCloud.positions;
    var offset=pointCloud.offset;
    var offset_phi=offset.phi;
    var offset_theta=offset.theta;
    var offset_depth=offset.depth;
    var points=json.points;
    var field_count=json.points_format.length;
    var step=Math.PI/180;

    var chunkLimit=kk+Math.max(points.length/100,200);
    if (chunkLimit>points.length) {
      chunkLimit=points.length;
    }

    var v=new THREE.Vector3();

    for (var k=kk; k<chunkLimit; k+=field_count) {

      var phi=points[k+offset_phi];
      var theta=points[k+offset_theta];
      var depth=points[k+offset_depth];

      // store particle index where it belongs
      var x=Math.round(theta/step)%360;
      var y=Math.round(phi/step);

      if (y<0) {
        y+=180;
      }

      section[x][y].push(k/field_count);

      if (pointCloud.allInOne) {
        // unit vector
        v.x=0;
        v.y=0;
        v.z=1;

        // apply rotations
        v.applyAxisAngle(panorama.Xaxis,phi);
        v.applyAxisAngle(panorama.Yaxis,theta);

        // store position
        positions[i]=-v.x*depth;
        positions[i+1]=v.y*depth;
        positions[i+2]=v.z*depth;
        i+=3;
      }

      pointCloud.progressBar.set(k/json.points.length);
    }

    if (k<points.length) {
      setTimeout(function(){
        pointCloud.parseJSONchunk(json,k);
      },50);

    } else {
      console.log('Parsing point cloud... done');
      pointCloud.progressBar.elem.remove();

    }

  }, // pointCloud.parseJSONchunk
*/
  ProgressBar: function ProgressBar(options) {

    var bar=this;
    
    $.extend(true, bar, {

        container: $('body'),
        css: {},
        value: 0.0,
        max: 1.0,

        init: function progressBar_init() {
          var bar=this;
          bar.elem=$('progress',bar.container);
          if (!bar.elem.length) {
            bar.elem=$('<progress max="'+bar.max+'" value="'+bar.value+'"></progress>');
            bar.elem
            .appendTo(bar.container)
            .css(bar.css);
          }
        }, // progressBar_init

        set: function progressBar_set(value) {
          var bar=this;
          $(bar.elem).attr('value',value);
        },  // progressBar_set

    }, options);

    bar.init();
   
  }, // pointCloud_progress
    
/*
  // rebuild the pointcloud positions array (visible points only)
  update: function pointCloud_update() {

      var pointCloud=this;
      var section=pointCloud.section;
      var panorama=pointCloud.panorama;
      var json=pointCloud.json;
      var points=json.points;

      // allocate new array
      var positions = new Float32Array(json.points.length * 3);

      var field_count=json.points_format.length;
      console.log('updating cloud...');

      // set pointcloud field offsets
      pointCloud.offset={};
      $.each(json.points_format,function(i,value){
        pointCloud.offset[value]=i;
      });
      var offset=pointCloud.offset;

      // compute field of view boundaries
      var halfov=panorama.camera.instance.fov/2;
      var aspect=panorama.camera.instance.aspect;

      var fov={
        theta: {
           min: (panorama.lon-halfov*aspect)+180,
           max: (panorama.lon+halfov*aspect)+180
        },
        phi: {
           min: ((panorama.lat+90-halfov)),
           max: ((panorama.lat+90+halfov))
        }
      }

      function _clamp(value,max) {
        if (value<0) return value+max;
        if (value>=max) return value-max;
        return value;
      }

      fov.theta.min=Math.round(_clamp(fov.theta.min,360));
      fov.theta.max=Math.round(_clamp(fov.theta.max,360));
      fov.phi.min=Math.round(_clamp(fov.phi.min,180)-90);
      fov.phi.max=Math.round(_clamp(fov.phi.max,180)-90);

      if (fov.theta.min>fov.theta.max) {
        fov.theta.max+=360;
      }

      if (fov.phi.min>fov.phi.max) {
        fov.phi.max+=180;
      }

      // rebuild positions array using particles indexes from visible
      // pointCloud.sections
      var v=new THREE.Vector3();
      var i=0;
      for (var iphi=fov.phi.min; iphi<fov.phi.max; ++iphi) {

        var _iphi = (iphi>=180) ? iphi-180 : (iphi<0) ? iphi+180 : iphi;

        for (var itheta=fov.theta.min; itheta<fov.theta.max; ++itheta) {

          $.each(section[(itheta<360)?itheta:itheta-360][_iphi],function(){
            var k=this*field_count;

            var phi=points[k+offset.phi];
            var theta=points[k+offset.theta];
            var depth=points[k+offset.depth];

            // unit vector
            v.x=0;
            v.y=0;
            v.z=1;

            // apply rotations
            v.applyAxisAngle(panorama.Xaxis,phi);
            v.applyAxisAngle(panorama.Yaxis,theta);

            // store position
            positions[i]=-v.x*depth;
            positions[i+1]=v.y*depth;
            positions[i+2]=v.z*depth;
            i+=3.0;

          });
        }
      }

      console.log('updating cloud... done ('+(i/3)+' particles)');


/*
    pointCloud.scene.remove(pointCloud.object3D);


    pointCloud.geometry=new THREE.BufferGeometry();
    pointCloud.geometry.addAttribute('position', new THREE.BufferAttribute(positions.subarray(0,i), 3));


    // instantiate object3D
    pointCloud.object3D=new THREE.PointCloud(pointCloud.geometry,pointCloud.dotMaterial);
    pointCloud.scene.add(pointCloud.object3D);
*/
/*
  pointCloud.geometry.attributes.position.array=positions.subarray(0,i);
  pointCloud.geometry.attributes.position.needsUpdate=true;

      pointCloud.panorama.drawScene();

  }, // pointCloud_update
*/

  /**
  * PointCloud.on_mesh_visibilitychange()
  *
  * update pointcloud on mesh_visibilitiychange
  *
  */
  on_mesh_visibilitychange: function pointCloud_on_meshvisibility_change(e){
    var mesh=this;
    var sphere=mesh.sphere;
    var panorama=sphere.panorama;

    if (panorama.pointCloud && panorama.pointCloud.instance) {
      var pointCloud=panorama.pointCloud.instance;

      // this method is a work in progress
      if (!pointCloud.testing) {
        return;
      }
//return
      if (mesh.particles) {
        if (mesh.particles.object3D.visible!=mesh._visible) {
          console.log((mesh._visible?'showing':'hiding')+' '+mesh.col+','+mesh.row);
        }
        mesh.particles.object3D.visible=mesh._visible;
        return;
      }    

      if (!pointCloud.updateTileSetParticleListTimeout) {
        pointCloud.updateTileSetParticleListTimeout=setTimeout(function(){
          pointCloud.updateTileSetParticleList();
          pointCloud.updateTileSetParticleListTimeout=null;
        },500);
      }
    }

  }, // pointCloud_on_meshvisibility_change

  /**
  * PointCloud.updateTileSetParticleList
  *
  * Complete the particle list for every visible tile
  *
  */
  updateTileSetParticleList: function pointCloud_updateTileSetParticleList() {

      var pointCloud=this;
      var section=pointCloud.section;
      var panorama=pointCloud.panorama;
      var json=pointCloud.json;
      var field_count=json.points_format.length;
      var points=json.points;
      var sphere=panorama.sphere;

      // this method is a work in progress
      if (!pointCloud.testing) {
        return;
      }

      // set pointcloud data field offsets
      pointCloud.offset={};
      $.each(json.points_format,function(i,value){
        pointCloud.offset[value]=i;
      });
      var offset=pointCloud.offset;

      console.log('updating tileSet particle list...');

      // allocate position attribute buffer
      if (!pointCloud.positions_buf) {
        pointCloud.positions_buf = new Float32Array(Math.floor(json.points.length * 3));
      }
      pointCloud.particle_count=0;
      var particle_count=0;
//return;
      // browse tiles
      $.each(sphere.object3D.children, function() {
        var mesh = this;

        // only visible tiles for which no particles have been associated yet
        if (mesh._visible) {
          if (!mesh.particles) {
            // compute particle list for this tile
            pointCloud.updateTileParticleList(mesh,pointCloud.positions_buf);
            pointCloud.particle_count+=mesh.particles.positions.length/3;
            particle_count+=mesh.particles.positions.length/3;

          }
          mesh.particles.object3D.visible=true;
        
        } else {
          if (mesh.particles) {
              mesh.particles.object3D.visible=false;
          }
        }
        console.log((mesh._visible?'showing':'hiding')+' '+mesh.col+','+mesh.row);

      });

      console.log('updating tileSet particle list... done ('+particle_count+' particles associated with visible tiles)');


/*
    pointCloud.scene.remove(pointCloud.object3D);


    pointCloud.geometry=new THREE.BufferGeometry();
    pointCloud.geometry.addAttribute('position', new THREE.BufferAttribute(positions.subarray(0,i), 3));


    // instantiate object3D
    pointCloud.object3D=new THREE.PointCloud(pointCloud.geometry,pointCloud.dotMaterial);
    pointCloud.scene.add(pointCloud.object3D);
*/
/*
  pointCloud.geometry.attributes.position.array=positions.subarray(0,i);
  pointCloud.geometry.attributes.position.needsUpdate=true;

      pointCloud.panorama.drawScene();
*/
  }, // pointCloud_updateTileSetParticleList

  /**
  * PointCloud.updateTileParticleList
  *
  * Build 'position' buffer attribute array for given tile
  *
  * @param mesh the tile's mesh
  * @parma positions_buf the preallocated Float32Array buffer
  *
  *
  */
  updateTileParticleList: function pointCloud_updateTileParticleList(mesh,positions_buf){

        var pointCloud=this;
        var section=pointCloud.section;
        var panorama=pointCloud.panorama;
        var sphere=panorama.sphere;
        var field_count=pointCloud.json.points_format.length;
        var offset=pointCloud.offset;
        var points=pointCloud.json.points;

        // this method is a work in progress
        if (!pointCloud.testing) return;

        if (!mesh.boundary) {

          // get tile boundaries in positive radians
          mesh.boundary=sphere.tileSet.getTileBoundaries(mesh.col,mesh.row);

          // convert boundaries to rounded degrees
          var lon={};
          var lat={};
          lon.min=Math.round(mesh.boundary.theta.min*180/Math.PI);
          lon.max=Math.round(mesh.boundary.theta.max*180/Math.PI);
          lat.min=Math.round(mesh.boundary.phi.min*180/Math.PI);
          lat.max=Math.round(mesh.boundary.phi.max*180/Math.PI);
          mesh.boundary.lon=lon;
          mesh.boundary.lat=lat;
        }

        // fill positions buffer with tile's particles using pointCloud.sections
        var boundary=mesh.boundary;
        var v=new THREE.Vector3();
        var i=0;

        boundary.theta.min=Math.round();

        // add points inconditionally for inner sections
        function addPointsInconditionally(_ilon,_ilat) {
            // add points from current section to tile's particle positions array
            $.each(section[_ilon][_ilat],function(){

              var particle_index=this;

              // get particle's json data base index
              var k=particle_index*field_count;

              // get particle spherical coordinates
              var phi=points[k+offset.phi];
              var theta=points[k+offset.theta];
              var depth=points[k+offset.depth];

              // unit vector
              v.x=0;
              v.y=0;
              v.z=1;

              // apply rotations
              v.applyAxisAngle(panorama.Xaxis,phi);
              v.applyAxisAngle(panorama.Yaxis,theta);

              // store particle position
              pointCloud.positions_buf[i]=-v.x*depth;
              pointCloud.positions_buf[i+1]=v.y*depth;
              pointCloud.positions_buf[i+2]=v.z*depth;
              i+=3;

            });
        }

        // check boundaries for outer sections (border)
        function addPointsConditionally(_ilon,_ilat) {
            // add points from current section to tile's particle positions array
            $.each(section[_ilon][_ilat],function(){

              var particle_index=this;

              // get particle's json data base index
              var k=particle_index*field_count;

              // get particle spherical coordinates
              var phi=points[k+offset.phi];
              var theta=points[k+offset.theta];
              var depth=points[k+offset.depth];

              // particle not in tile ?
              if (
              false &&
                (theta < mesh.boundary.theta.min || theta >= mesh.boundary.theta.max) ||
                (phi < mesh.boundary.phi.min || phi >= mesh.boundary.phi.max)
              ) {
                // skip
                return true;
              }

              // unit vector
              v.x=0;
              v.y=0;
              v.z=1;

              // apply rotations
              v.applyAxisAngle(panorama.Xaxis,phi);
              v.applyAxisAngle(panorama.Yaxis,theta);

              // store particle position
              pointCloud.positions_buf[i]=-v.x*depth;
              pointCloud.positions_buf[i+1]=v.y*depth;
              pointCloud.positions_buf[i+2]=v.z*depth;
              i+=3;

            });
        }

        // browse the tile vertical inner sectors, degree after degree
        for (var ilat=boundary.lat.min+1; ilat<boundary.lat.max; ++ilat) {

          var lat=_clamp(ilat,180);

          // browse the tile horizontal inner sectors, degree after degree
          for (var ilon=boundary.lon.min+1; ilon<boundary.lon.max; ++ilon) {
            addPointsInconditionally(_clamp(ilon,360),lat);
          }

        }

        // horizontal borders
        var lat_min=_clamp(boundary.lat.min,180);
        var lat_max=_clamp(boundary.lat.max,180);

        for (var ilon=boundary.lon.min; ilon<=boundary.lon.max; ++ilon) {
          var lon=_clamp(ilon,360);
          addPointsConditionally(lon,lat_min);
          addPointsConditionally(lon,lat_max);
        }

        var lon_min=_clamp(boundary.lon.min,360);
        var lon_max=_clamp(boundary.lon.max,360);
        
        // vertical borders
        for (ilat=boundary.lat_min+1; ilat<boundary.lat.max; ++ilat) {
          var lat=_clamp(ilat,180);
          addPointsConditionally(lon_min,lat);
          addPointsConditionally(lon_max,lat);
        }

        // store tile's particle position array
        mesh.particles={
          positions: positions_buf.subarray(0,i),
          geometry: new THREE.BufferGeometry()
        }

        // create tile's particles object3D and add to pointCloud.object3D
        mesh.particles.geometry.addAttribute('position', new THREE.BufferAttribute(mesh.particles.positions,3));
        mesh.particles.object3D=new THREE.PointCloud(mesh.particles.geometry, pointCloud.dotMaterial.clone());
        pointCloud.object3D.add(mesh.particles.object3D);

        console.log('tile('+mesh.col+','+mesh.row+') : '+(i/3)+' particles');

  }, // pointCloud_updateTileParticleList

  // pointcloud 'load' event handler
  onload: function pointCloud_onload(e) {

    var pointCloud=this;
    var panorama=pointCloud.panorama;

    switch(e.dataType) {
      case 'sections':
        pointCloud.section={
          data: new Uint32Array(e.buffer),
          index: new Uint32Array(e.buffer,e.buffer.byteLength-8*360*180)
        }
        break;
    }

    pointCloud.updateTileSetParticleList();

    // add pointcloud to scene
    var scene=(pointCloud.overlay)?pointCloud.scene:panorama.scene;

    if (pointCloud.testing) {
      scene.add(pointCloud.object3D);
    }
    if (pointCloud.allInOne) {
      scene.add(pointCloud._object3D);
    }

    pointCloud.dispatch('ready');

    panorama.drawScene();

  }, // pointCloud_onload

  // pointcloud 'loaderror' event handler
  onloaderror: function pointCloud_onloaderror(e) {
    console.log(e);
  }, // onloaderror

  // render pointcloud overlay on "panorama render" event
  on_panorama_render: function pointCloud_on_panorama_render(){

    var panorama=this;
    if (!panorama.pointCloud) {
      return;
    }

    var pointCloud=panorama.pointCloud.instance;
    if (!pointCloud) {
      return;
    }

    if (pointCloud._object3D) {
      pointCloud._object3D.visible=pointCloud.visible;
    }
    
    var cursor=pointCloud.cursor;
    if (cursor) {
      var scale=0.1/panorama.getZoom();
      cursor.sprite.scale.set(scale,scale,scale);
    }

    if (pointCloud.overlay) {
      panorama.renderer.clearDepth();
      panorama.renderer.render(pointCloud.scene,panorama.camera.instance);
    }

    pointCloud.dispatch('render');

  }, // on_panorama_render

  // trigger pointcloud 'particlemouseover' event on particle mouseover
  on_panorama_mousemove: function pointCloud_on_panorama_mousemove(e){

    var panorama=this;
    var pointCloud=panorama.pointCloud;

    if (!pointCloud.instance || !pointCloud.instance.enableParticleEvents) {
      return;
    }

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

/*
    // setup raycaster
    var raycaster=pointCloud.instance.raycaster;
    raycaster.instance.setFromCamera(mouse,panorama.camera.instance);

    // get intersection list
    var intersections=raycaster.instance.intersectObject(pointCloud.instance.object3D);

*/

    panorama.getMouseCoords(e);
    var lon=Math.round(panorama.mouseCoords.lon)-180;
    var lat=-Math.round(panorama.mouseCoords.lat);
    if (lat<0) lat+=180;
    if (lon<0) lon+=360;

    var index=(lon*180+lat)<<1;
    var particles={
      offset: pointCloud.instance.sector.index[index],
      count: pointCloud.instance.sector.index[index+1]
    }

    // trigger pointcloud mouseover event
    if (particleList_offset) {
      pointCloud.instance.dispatch({
          type: 'particlemouseover',
          target: particles,
          originalEvent: e
      });

    } else {
      if (pointCloud.instance.hover){
        pointCloud.instance.dispatch({
            type: 'particlemouseout',
            target: pointCloud.instance.hover.index,
            originalEvent: e
        });
      }
    }

  }, // pointCloud_on_panorama_render

  // snap to nearest intersecting particle
  onparticlemouseover: function on_pointcloud_particlemouseover(e){

    var pointCloud=this;
    var panorama=pointCloud.panorama;

    var particles=e.target;

    // get nearest point index
    panorama.getMouseCoords(e.originalEvent);
    var hover={index: pointCloud.nearestParticle(panorama.mouseCoords,particles)};

    // if we were already hovering
    if (pointCloud.hover) {

      // and it was another point
      if (hover.index != pointCloud.hover.index){
        // then trigger 'particlemouseout'
        var e={
            type: 'particlemouseout',
            target: pointCloud.hover.index
        }
        // unless event handler doesnt agree to remove hover attribute
        if (pointCloud.dispatch(e)===false) {
          return false;
        }
      } else {
        // already hovering the same point, return
        return
      }
    }

    // mousein
    pointCloud.hover=hover;

    var material;
    var cursor=pointCloud.cursor;

    // instantiate cursor if needed
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

    cursor.sprite.visible=pointCloud.showParticleCursor;

    cursor.sprite.position.copy(new THREE.Vector3().copy(pointCloud.getParticlePosition(hover.index)).normalize().multiplyScalar(10));

    pointCloud.panorama.drawScene();

    pointCloud.dispatch({
        type: 'particlemousein',
        target: hover.index
    });

  }, // pointCloud_particleonmouseover

  onparticlemousein: function pointCloud_onparticlemousein(e) {
    var pointCloud=this;
    if (pointCloud.showDebugInfo) {
      pointCloud.showParticleInfo(pointCloud.hover.index);
    }
  }, // pointCloud_onparticlemousein

  onparticlemouseout: function pointCloud_onparticlemouseout(e) {
    var pointCloud=this;
    if (pointCloud.hideDebugInfo) {
      pointCloud.hideParticleInfo();
    }
  }, // pointCloud_onparticlemousein

  // return particle with least square distance from coords in radians
  nearestParticle: function pointCloud_nearestParticle(coords,particles) {
    var pointCloud=this;
    var panorama=pointCloud.panorama;
    var candidate={
      index: 0
    }
    var d2min=999;
    var data=pointCloud.section.data;
  
    // get mouse normalized coordinates
    var r=panorama.sphere.radius; 
    var phi=panorama.mouseCoords.phi;
    var theta=panorama.mouseCoords.theta;
    var mx=r*sin(phi)*cos(theta);
    var my=r*sin(phi)*sin(theta);
    var mz=r*cos(phi);
    var mn=Math.sqrt(mx*mx+my*my+mz*mz);
    mx/=mn;
    my/=mn;
    mz/=mn;

    for (var i=0; i<particles.count; ++i) {

      // get particle data index
      var index=particles.offset+i*3;

      // particle normalized coordinates
      var x=data[index];
      var y=data[index+1];
      var z=data[index+2];
      var n=Math.sqrt(x*x+y*y+z*z);
      var nx=x/n;
      var ny=y/n;
      var nz=z/n;

      // squared distance from normalized mouse coordinates
      var dx=mx-nx;
      var dy=my-ny;
      var dz=mz-nz;
      var dsquare=dx*dx+dy*dy+dz*dz;

      // select least square distance
      if (dsquare<d2min) {
        d2min=dsquare;
        candidate.index=index;
        candidate.norm=n;

      // select nearest point, when equidistant from cursor
      } else if (dsquare==d2min && candidate.norm>n) {
          candidate.index=index;
          candidate.norm=n;
        }
      }

    });

    return candidate.index/3;

  }, // pointCloud_nearestParticle

  // return spherical particle world coordinates
  getParticleSphericalCoords: function pointCloud_getParticleSphericalCoords(index) {
    var pointCloud=this;
    var points=pointCloud.json.points;
    var offset=pointCloud.offset;
    index*=pointCloud.json.points_format.length;
    return {
      lon: points[index+offset.theta]*180/Math.PI-180,
      lat: -points[index+offset.phi]*180/Math.PI,
      radius: points[index+offset.depth]
    }
  }, // pointCloud_getParticleSphericalCoords

  // return cartesian particle world coordinates
  getParticlePosition: function pointCloud_getParticlePosition(index) {
    var pointCloud=this;
    var data=pointCloud.section.data;

    index*=3;

    return {
      x: data[index],
      y: data[index+1],
      z: data[index+2]
    }
  }, // pointCloud_getParticlePosition

  showParticleInfo: function pointCloud_showParticleInfo(index) {

    var pointCloud=this;
    var points=pointCloud.json.points;
    var panorama=pointCloud.panorama;
    var offset=pointCloud.offset;
    index*=pointCloud.json.points_format.length;

    var div = $('#info');
    if (!div.length) {

        // create #info div
        div = $('<div id="info"><div id="particle"></div></div>')

        div.appendTo(panorama.container).css({
            position: 'absolute',
            top: 10,
            left: 10,
            width: 160,
            padding: 10,
            backgroundColor: "rgba(0,0,0,.4)",
            color: 'white'
        });

    }

    // particle info
    if (points[index+offset.theta]==undefined) {
      return;
    }
    var html = '<div style="width: 100%; position: relative; margin-left: 10px;">'
    + '<b>Particle info:</b><br />'
//    + 'theta: ' + points[index+offset.theta].toPrecision(6) + '<br />'
//    + 'phi: ' + points[index+offset.phi].toPrecision(6) + '<br />'
    + 'distance: ' + points[index+offset.depth].toPrecision(6) + '<br />'
    + 'index: ' + points[index+offset.index] + '<br />';

    $('#particle',div).html(html);

    // trigger pointcloud_updateinfo
    var e={
      type: 'showParticleInfo',
      div: div
    }
    pointCloud.dispatch(e);

    div.show(0);

  }, // pointCloud_showParticleInfo

  hideParticleInfo: function pointCloud_hideParticleInfo(){
    $('#particleInfo').hide(0);
  }, // pointCloud_hideParticleInfo

  // dispatch particle click on panorama click
  on_panorama_click: function pointCloud_on_panorama_click(e) {
    var panorama=this;
    var pointCloud=panorama.pointCloud.instance;

    // only when a particle is hovered by mouse
    if (!pointCloud || !pointCloud.hover) {
      return;
    }

    pointCloud.dispatch({
        type: 'particleclick',
        target: pointCloud.hover.index,
        originalEvent: e
    });

  }, // pointCloud_on_panorama_click

  // instantiate point cloud on panorama_ready
  on_panorama_ready: function pointCloud_on_panorama_ready(e) {

    var panorama=this;

    // only if the pointcloud is defined and active
    if (panorama.pointCloud && panorama.pointCloud.active!==false) {

      // get panorama to pointcloud url conversion parameters
      var urlReplace=panorama.pointCloud.urlReplace||PointCloud.prototype.defaults.urlReplace;
      var replaceThis=urlReplace.replaceThis;
      var replaceWithThis=urlReplace.replaceWithThis;

      // validate every possible URL according to urlReplace.suffix[] and use the first available one

      var validatedURL=[];
      var numRepliesExpected=urlReplace.suffix.length;

      // ajax HEAD callback
      var callback=function pointcloud_ajax_head_callback(result,url,i) {

        validatedURL[i]=(result=='success')?url:null;

        // last ajax reply expected ?
        --numRepliesExpected;
        if (!numRepliesExpected) {

          // use the first URL available
          $.each(validatedURL,function(type){

            if (validatedURL[type]) {

              // instantiate pointcloud
              var pointCloud=panorama.pointCloud.instance=new PointCloud($.extend(true,{},panorama.pointCloud,{
                    panorama: panorama,
                    url: validatedURL[type],
                    type: type
              }));

              // exit loop
              return false;

            }

          });
        }
      } // pointcloud_ajax_head_callback


      // validate urls
      $.each(urlReplace.suffix,function(i,suffix){

        var pointcloud_json_url=panorama.sphere.tileSet.dirName.replace(replaceThis,replaceWithThis)+panorama.list.currentImage+suffix;

        // javascript loop closure
        (function(pointcloud_json_url,i,callback){

          // validate url
          $.ajax({
            url: pointcloud_json_url,
            type:'HEAD',
            error: function() {
              callback('error');

            },
            success: function() {
              callback('success',pointcloud_json_url,i);
            }
          });

        })(pointcloud_json_url,i,callback);
      });

    }

  }, // pointCloud_on_panorama_ready

  // dispose pointcloud on panorama dispose
  on_panorama_dispose: function pointCloud_on_panorama_dispose(e) {
    var panorama=this;
    if (panorama.pointCloud && panorama.pointCloud.instance) {

      // remove pointcloud from scene
      var scene=(panorama.pointCloud.instance.overlay)?panorama.pointCloud.instance.scene:panorama.scene;
      scene.remove(panorama.pointCloud.instance.object3D);

      // delete object
      delete panorama.pointCloud.instance;
    }
  } // pointCloud_on_panorama_dispose

});

function _clamp(value,max) {
  while (value<0) value+=max;
  while (value>=max) value-=max;
  return value;
}

setupEventDispatcher(PointCloud.prototype);

// subscribe to panorama events
Panorama.prototype.dispatchEventsTo(PointCloud.prototype);
THREE.Mesh.prototype.dispatchEventsTo(PointCloud.prototype);
