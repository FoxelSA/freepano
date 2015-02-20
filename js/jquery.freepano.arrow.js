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

WidgetFactory('Arrow');

$.extend(true,Arrow.prototype,{

    color: {
      active: '#0000ff',
      hover: '#000000',
      normal: '#ffffff'                                                                                     
    },

    defaultMesh: function arrow_mesh() {
      var arrow=this;
      var geometry=new THREE.Geometry();
      var s=arrow.size;
      geometry.vertices.push(new THREE.Vector3(-s,-s,0));
      geometry.vertices.push(new THREE.Vector3(s,-s,0));
      geometry.vertices.push(new THREE.Vector3(0,s,0));
      geometry.vertices.push(new THREE.Vector3(-s/2,-s,0));
      geometry.vertices.push(new THREE.Vector3(s/2,-s,0));
      geometry.vertices.push(new THREE.Vector3(-s,-8*s,0));
      geometry.vertices.push(new THREE.Vector3(s,-8*s,0));
      geometry.faces.push(new THREE.Face3(0,1,2));
      geometry.faces.push(new THREE.Face3(5,4,3));
      geometry.faces.push(new THREE.Face3(5,6,4));

      var mesh=new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3
      }));

      mesh.rotateX(75*Math.PI/180);

      return mesh;
    },

    widget_prototype_update: Arrow.prototype.update,

    update: function arrow_update() {
      var arrow=this;
      //arrow.coords.lat=Math.max(5,arrow.panorama.lat+5);
      arrow.widget_prototype_update.call(this);
    },

    onclick: function arrow_onclick(e){
      var arrow=this;
      arrow.panorama.list.show(arrow.target);
      return false;
    }

}); // extend Arrow prototype

$.extend(true,Arrow_list.prototype,{

}); // extend Arrow_list prototype
