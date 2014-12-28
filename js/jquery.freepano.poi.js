WidgetFactory('POI');

$.extend(true,POI_list.prototype,{

    // use panorama perspective camera, but create a separate scene
    poiList_prototype_init: POI_list.prototype.init,
    init: function poiList_init(){
      var poi_list=this;
      var panorama=poi_list.panorama;
      poi_list.camera=panorama.camera;
      poi_list.scene=new THREE.Scene();
      poi_list.poiList_prototype_init();
    }, // poiList_init

    on_panorama_render: function poiList_on_panorama_render() {

      var panorama=this;
      if (!(panorama.poi instanceof POI_list)) {
        return;
      }

      // render POIs over panorama scene
      panorama.renderer.clearDepth();
      panorama.renderer.render(panorama.poi.scene,panorama.poi.camera.instance);

    } // poiList_on_panorama_render

}); // extend POI list prototype
