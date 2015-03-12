/*
 * freepano - WebGL panorama viewer
 *
 * Copyright (c) 2014-2015 FOXEL SA - http://foxel.ch
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

// this file must be loaded after jquery.freepano.pointcloud.js

function ParticleSequence_loader(options) {
  if (!this instanceof ParticleSequence_loader) {
    return new ParticleSequence_loader(options);
  }
  $.extend(true,this,ParticleSequence_loader.prototype.defaults,options);
  this.init();
}

$.extend(ParticleSequence_loader.prototype,{

    defaults: {
      poi_path: window.poi_path
    },

    init: function parSeq_init() {
    },

    on_pointcloud_init: function ParticleSequence_on_pointcloud_init(e) {
      var pointCloud=this;
      var panorama=pointCloud.panorama;
      panorama.particleSequenceLoader=new ParticleSequence_loader({panorama: panorama});

    }, // particleSequenceLoader_on_pointcloud_init

    on_pointcloud_ready: function particleSequenceLoader_on_pointcloud_ready(e){
      var pointCloud=this;
      var panorama=pointCloud.panorama;
      var seq_loader=panorama.particleSequenceLoader;

      if (!seq_loader) {
          return;
      }

      // make sure this handler is not run twice for the same event instance
      if (e.particleSequenceLoader_was_here){
        console.log('fixme');
        return;
      }
      e.particleSequenceLoader_was_here=true;

      // run only in poi_edit mode
      if (!document.location.search.match(/action=poi_edit/)) {
         return;
      }

      // load particle sequences
      $.ajax({
          url: seq_loader.poi_path+panorama.list.currentImage+'_seq.json',

          // network or server error
          error: function() {

            // initialize an empty sequence list
            if (panorama.pointCloud && panorama.pointCloud.instance && panorama.pointCloud.instance.sequence) {
              var pointCloud=panorama.pointCloud.instance;
              pointCloud.sequence=[new pointCloud.Sequence({
                pointCloud: pointCloud
              })];
            }

            // propagate pointCloud 'ready' event
   //         pointCloud.dispatch(e);

          },

          // server replied
          success: function(json){

            // server did not return a valid list
            if (!json || !json.list) {
              console.log('fix me');
              return;
            }

            // initialize sequence lists
            var sequence=[];
            $.each(json.list,function(){
              var particle_list=this.particle_list;
              var color=this.color;
              sequence.push(new pointCloud.Sequence({
                    pointCloud: pointCloud,
                    color: color,
                    particle_list: particle_list
              }));
            });

            // append an empty sequence
            sequence.push(new pointCloud.Sequence({
              pointCloud: pointCloud
            }));

            // assign sequence list to pointCloud
            panorama.pointCloud.instance.sequence=sequence; 

            // trigger particlesequence 'ready' event
            pointCloud.dispatch('sequenceload');

            panorama.drawScene();
          }
      });

      // delay pointCloud 'ready' propagation (wait for ajax completion)
    //  return false;

    } // particleSequenceLoader_on_pointcloud_ready

});

// subscribe to PointCloud events
PointCloud.prototype.dispatchEventsTo(ParticleSequence_loader.prototype);



