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

