function POI_loader(options) {
  if (!this instanceof POI_loader) {
    return POI_loader(options);
  }
  $.extend(true,this,options);
  this.init();
}

$.extend(POI_loader.prototype,{
    init: function poiLoader_init() {
    },
    on_panorama_ready: function poiLoader_onPanoramaReady(e){
      var panorama=this;
      $.ajax({
          url: poi_path+panorama.list.currentImage+'.json',
          error: function() {
            $.notify('Error: Cannot load POI data');
          },
          success: function(json) {
            panorama.poi=JSON.parse(json);
          }
      });
    }
});

Panorama.prototype.setupCallback(POI_loader.prototype);
