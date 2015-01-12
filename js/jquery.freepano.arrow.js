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
      arrow.coords.lat=5;
      arrow.widget_prototype_update();
    },

    onclick: function arrow_onclick(e){
      var arrow=this;
      arrow.panorama.list.show(arrow.target);
      return false;
    }

}); // extend Arrow prototype

$.extend(true,Arrow_list.prototype,{

}); // extend Arrow_list prototype
