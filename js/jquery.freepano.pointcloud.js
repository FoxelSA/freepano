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
      suffix: [ '.bin' ]
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

  // load point cloud from url
  fromURL: function pointCloud_fromURL(url) {

    var pointCloud=this;

    pointCloud.url=url;

    console.log('loading pointCloud from URL');

    // load sectors.bin
    loadData({
      object: pointCloud,
      dataType: 'sectors',
      url: url
    });

  }, // pointCloud_fromURL

  progress: function pointCloud_progress(e) {

    var pointCloud=this;

    if (e && e.type!='progress') {

       if (!pointCloud.progressBar) {
         return;
       }

       // remove progress bar
       pointCloud.progressBar.dispose();
       pointCloud.progressBar=null;
       return;
    }

    if (e && !e.lengthComputable) {
      // nothing to display
      return;
    }

    if (!pointCloud.progressBar) {
      // setup progress bar
      pointCloud.progressBar=new ProgressBar({
        text: {
          value: "Loading point cloud data"
        }
      });
    }

    if (e) {
      pointCloud.progressBar.set(e.loaded/e.total);
    }

  }, // pointCloud_progress

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
      var sector=pointCloud.sector;
      var panorama=pointCloud.panorama;
      var sphere=panorama.sphere;

      // this method is a work in progress
      if (!pointCloud.testing) {
        return;
      }

      console.log('updating tileSet particle list...');

      // allocate position attribute buffer
      if (!pointCloud.positions_buf) {
        pointCloud.positions_buf = new Float32Array(Math.floor(json.points.length * 3));
      }
      pointCloud.particle_count=0;
      var particle_count=0;

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
        var sector=pointCloud.sector;
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

        // fill positions buffer with tile's particles using pointCloud.sectors
        var boundary=mesh.boundary;
        var v=new THREE.Vector3();
        var i=0;

        boundary.theta.min=Math.round();

        // add points inconditionally for inner sectors
        function addPointsInconditionally(_ilon,_ilat) {
            // add points from current sector to tile's particle positions array
            $.each(sector[_ilon][_ilat],function(){

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

        // check boundaries for outer sectors (border)
        function addPointsConditionally(_ilon,_ilat) {
            // add points from current sector to tile's particle positions array
            $.each(sector[_ilon][_ilat],function(){

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

  // create views for pointcloud data and trigger pointcloud 'ready' event
  onload: function pointCloud_onload(e) {

    var pointCloud=this;
    var panorama=pointCloud.panorama;
    var buffer=e.data;

    switch(e.dataType) {
      case 'sectors':

        if (buffer.byteLength<8) {
          break;
        }

        var buf=new Uint8Array(buffer);
        var marker_byteCount=2;
        var FILE_HEADER_SIZE=16;

        // check file marker
        if (buf[0]!=parseInt('F0',16) || buf[0]!=buf[buffer.byteLength-2] || buf[1]!=parseInt('E1',16) || buf[1]!=buf[buffer.byteLength-1]) {
          $.notify('Point cloud: Invalid file marker');
          break;
        }

        // get file type and version
        var VERSION_NUMBER='';
        for (var i=0; i<9; ++i) {
          VERSION_NUMBER+=String.fromCharCode(buf[marker_byteCount+i]);
        }

        // check file type and version
        if (VERSION_NUMBER.split('.')[0]!="fpcl") {
          $.notify('Point cloud: Invalid file type');
          break;
        }
        if (VERSION_NUMBER.split('.')[1]!="0003") {
          $.notify('Point cloud: Invalid file version');
          break;
        }

        // length in bytes of the sectors array index
        var buf_index_byteCount=8*360*180;

        var buf_data_offset=FILE_HEADER_SIZE;

        // length in bytes of the coordinates arrays
        var buf_coordinates_byteCount = buffer.byteLength
                                      - buf_data_offset
                                      - buf_index_byteCount
                                      - marker_byteCount;

        // theres two subseqent sets of coordinates in the buffer (WebGL/32bits followed by MN95/64bits), sharing the same index
        var buf_webgl_coordinates_byteCount=buf_coordinates_byteCount/3;

        console.log('points count:',Math.floor(buf_webgl_coordinates_byteCount/12));

        pointCloud.sector={
          data: new Float32Array(buffer, buf_data_offset, buf_webgl_coordinates_byteCount/4),
          mn95: new Float64Array(buffer, buf_data_offset + buf_webgl_coordinates_byteCount, (buf_coordinates_byteCount-buf_webgl_coordinates_byteCount)/8),
          index: new Uint32Array(buffer, buffer.byteLength - marker_byteCount - buf_index_byteCount, buf_index_byteCount/4)
        }
        break;
    }

    pointCloud.updateTileSetParticleList();

    // add pointcloud to scene
    var scene=(pointCloud.overlay)?pointCloud.scene:panorama.scene;

    if (pointCloud.testing||pointCloud.allInOne) {
      scene.add(pointCloud.object3D);
    }
    pointCloud.dispatch('ready');
    panorama.drawScene();

  }, // pointCloud_onload

  // instantiate pointcloud from given buffer and add to main object3D, return object3D
  add: function pointCloud_add(options) {

      var pointCloud=this;

      pointCloud.geometry=new THREE.BufferGeometry();

      // add particles to geometry
      pointCloud.geometry.addAttribute('position', new THREE.BufferAttribute(options.positions, 3));

      // instantiate pointCloud and add to main object3D
      var dotMaterial=pointCloud.dotMaterial.clone();
      dotMaterial.color.set('red');
      var object3D=new THREE.PointCloud(pointCloud.geometry,pointCloud.dotMaterial.clone());
      object3D.sortParticles=pointCloud.sortParticles;

      pointCloud.object3D.add(object3D);

      return object3D;

  }, // pointCloud_add

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
    if (pointCloud.object3D) {
      pointCloud.object3D.visible=pointCloud.visible;
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
      !pointCloud.instance.sector
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
    var lon=Math.round(panorama.mouseCoords.lon);
    var lat=Math.round(panorama.mouseCoords.lat);
    if (lat<0) lat+=180;
    if (lon<0) lon+=360;
    var index=(lat*360+lon)<<1;
    var particles={
      offset: pointCloud.instance.sector.index[index],
      count: pointCloud.instance.sector.index[index+1]
    }

    // trigger pointcloud mouseover event
    if (particles.count) {
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
    var hover={index: pointCloud.nearestParticle(particles)};

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

  // return index of particle with least square distance from mouse coords
  nearestParticle: function pointCloud_nearestParticle(particles) {
    var pointCloud=this;
    var panorama=pointCloud.panorama;
    var candidate={
      index: 0
    }
    var d2min=999;
    var data=pointCloud.sector.data;

    // get mouse coordinates on the unit sphere

    var mx=panorama.mouseCoords.x;
    var my=panorama.mouseCoords.y;
    var mz=panorama.mouseCoords.z;
    var n=Math.sqrt(mx*mx+my*my+mz*mz);

    mx=mx/n;
    my=my/n;
    mz=-mz/n;

//console.log('-----')
//console.log(mx,my,mz)

    for (var i=0; i<particles.count; ++i) {

      // get particle data index
      var index=particles.offset+i*3;

      // get particle world coordinates
      var x=data[index];
      var y=data[index+1];
      var z=data[index+2];
      var depth=Math.sqrt(x*x+y*y+z*z);

      // get coordinates on the unit sphere
      x=x/depth;
      y=y/depth;
      z=z/depth;

//      console.log(x,y,z);

      // get offset to mouse coordinates
      // (need to swap mz and mx)
      var dx=x-mz;
      var dy=y-my;
      var dz=z-mx;

      // select least square distance
      var dsquare=dx*dx+dy*dy+dz*dz;
      if (dsquare<d2min) {
        d2min=dsquare;
        candidate.index=index;
        candidate.depth=depth;

      // select nearest point, when equidistant from cursor
      } else if (dsquare==d2min && candidate.depth>depth) {
          candidate.index=index;
          candidate.depth=depth;
      }
    }

    // return particle index
    return candidate.index/3;

  }, // pointCloud_nearestParticle

  // return spherical particle world coordinates
  getParticleSphericalCoords: function pointCloud_getParticleSphericalCoords(index) {
    var pointCloud=this;

    index*=3;

    // get cartesian coordinates
    var data=pointCloud.sector.data;
    var x=data[index];
    var y=data[index+1];
    var z=data[index+2];

    // convert to spherical coordinates
    var r=Math.sqrt(x*x+y*y+z*z);
    var theta = Math.atan2(x,z);
    var phi = Math.asin(y/r);

    var lon=-theta*180/Math.PI-180;
    if (lon<0) lon+=360;

    var lat=phi*180/Math.PI;


    return {
      lon: lon,
      lat: phi*180/Math.PI,
      radius: r
    }

  }, // pointCloud_getParticleSphericalCoords

  // return cartesian particle world coordinates
  getParticlePosition: function pointCloud_getParticlePosition(index) {
    var pointCloud=this;
    var data=pointCloud.sector.data;
    var mn95=pointCloud.sector.mn95;

    index*=3;

    return {
      x: data[index],
      y: data[index+1],
      z: data[index+2],
      mn95: {
        n: mn95[index],
        e: mn95[index+1],
        h: mn95[index+2]
      }
    }
  }, // pointCloud_getParticlePosition

  showParticleInfo: function pointCloud_showParticleInfo(index) {

    var pointCloud=this;
    var panorama=pointCloud.panorama;

    var div = $('#info');
    if (!div.length) {
        // create #info div
        div = $('<div id="info"><div id="particle"></div></div>')
        div.appendTo(panorama.container);
        $('div#info',panorama.container).addClass('particle_info');
    }

    // particle info
    var pos=pointCloud.getParticlePosition(index);
    var depth=Math.sqrt(pos.x*pos.x+pos.y*pos.y+pos.z*pos.z);
    var html = '<div style="width: 100%; position: relative; margin-left: 10px;">'
//    + '<b>Particle info:</b><br />'
//    + 'theta: ' + points[index+offset.theta].toPrecision(6) + '<br />'
//    + 'phi: ' + points[index+offset.phi].toPrecision(6) + '<br />'
//    + 'distance: ' + depth.toPrecision(6) + '<br />'
//    + 'index: ' + index + '<br />'
      + '<span class="left">E:</span><span class="mn95">'+ pos.mn95.n.toFixed(3) + ' [m]</span><br />'
      + '<span class="left">N:</span><span class="mn95">'+ pos.mn95.e.toFixed(3) + ' [m]</span><br />'
      + '<span class="left">H:</span><span class="mn95">'+ pos.mn95.h.toFixed(3) + ' [m]</span><br />';

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

        var pointcloud_url=panorama.sphere.tileSet.dirName.replace(replaceThis,replaceWithThis)+panorama.list.currentImage+suffix;

        // javascript loop closure
        (function(pointcloud_url,i,callback){

          // validate url
          $.ajax({
            url: pointcloud_url,
            type: 'HEAD',
            error: function() {
              callback('error');

            },
            success: function() {
              callback('success',pointcloud_url,i);
            }
          });

        })(pointcloud_url,i,callback);
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
