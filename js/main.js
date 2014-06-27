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

$(document).ready(function(){

  $('#pano').panorama({

    camera: {
      zoom: {
        max: 1.5
      }
    },

    fov: {
      max: 140
    },

    renderer: {
      precision: 'lowp',
      antialias: false,
      alpha: false

    },
    pyramid: {
      dirName: 'img/dreamsofmouron/result_1386335738_995170-0-25-1/1024',
      baseName: 'result_1386335738_995170-0-25-1',
      levels: 4,
      preload: true
      /*
      sphere: [
        {
          radius: 1
        },
        {
          radius: 2
        },
        {
          radius: 4
        },
        {
          radius: 8
        },
        {
          radius: 16
        },
      ]
      */
    },

    __sphere: {
      texture: {
        dirName: 'img/dreamsofmouron/result_1386335738_995170-0-25-1/1024/1',
        baseName: 'result_1386335738_995170-0-25-1',
        columns: 4,
        rows: 2
      }
    },

    postProcessing: {
      enabled: false,
      edge: {
        shader: THREE.EdgeShader,
        enabled: false,
        uniforms: {
          aspect: function(panorama) {
            this.value.x=$(panorama.container).width();
            this.value.y=$(panorama.container).height();
          }
        }
      },

      edge2: {
        shader: THREE.EdgeShader2,
        enabled: false,
        uniforms: {
          aspect: function(panorama) {
            this.value.x=$(panorama.container).width();
            this.value.y=$(panorama.container).height();
          }
        }
      }
    }
  });

  var panorama=$('#pano').data('pano');

  $(document).on('keypress',function(e){
    switch(e.keyCode) {
    case 49:
      toggleEffect(panorama.postProcessing.edge);
      break;
    case 50:
      toggleEffect(panorama.postProcessing.edge2);
      break;
    }
    panorama.postProcessing.enabled=panorama.postProcessing.edge.pass.enabled||panorama.postProcessing.edge2.pass.enabled;
  });

  function toggleEffect(effect){
    effect.pass.enabled=!effect.pass.enabled;
    panorama.drawScene();
  }

});

