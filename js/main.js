$(document).ready(function(){
  touchHandler_init();
  $('#pano').panorama({
    renderer: {
      precision: 'lowp',
      antialias: false,
      alpha: false

    },
  /*
    sphere: {
      texture: {
        src: 'img/dreamsofmouron/result_1386335738_995170-0-25-1/1024/2/',
        rows: 4,
        colums: 8,
        baseName: 'result_1386335738_995170-0-25-1'
      }
    },
*/
    sphere: {
      pyramid: {
        src: 'img/dreamsofmouron/result_1386335738_995170-0-25-1/1024/',
        levels: 4,
        current: 2,
        baseName: 'result_1386335738_995170-0-25-1'
      }
    },
    postProcessing: {
      enabled: true,
      edge: {
        shader: THREE.EdgeShader,
        enabled: false,
        uniforms: {
          aspect: function(pano) {
            this.value.x=$(pano.container).width();
            this.value.y=$(pano.container).height();
          }
        }
      },
      edge2: {
        shader: THREE.EdgeShader2,
        enabled: false,
        uniforms: {
          aspect: function(pano) {
            this.value.x=$(pano.container).width();
            this.value.y=$(pano.container).height();
          }
        }
      }
    }
  });

  var pano=$('#pano').data('pano');

  $(document).on('keypress',function(e){
    switch(e.keyCode) {
    case 49:
      toggleEffect(pano.postProcessing.edge);
      break;
    case 50:
      toggleEffect(pano.postProcessing.edge2);
      break;
    }
  });
  function toggleEffect(effect){
    effect.pass.enabled=!effect.pass.enabled;
    pano.drawScene();
  }
});

