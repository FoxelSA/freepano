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

 /**
 * ImageFilter(options)
 *
 * ImageFilter object constructor
 *
 * @param options.target  target canvas selector or element
 * @param options.widgetType   widget type, defaults to 'slider'
 * @param options.container  widget dom container
 * @param options.filterType  canman filter type (see ImageFilter.filterTypeAvailable)
 * @param options.filter  filter name (see ImageFilter.list)
 * @param options.settings to override default filter settings
 *
 */
function ImageFilter(options) {
  if (!(this instanceof ImageFilter)) {
    return new ImageFilter(options);
  }
  $.extend(true,this,this.defaults,options);
  this.init();
}

$.extend(true,ImageFilter.prototype,{
  defaults: {
    widgetType: 'slider',
    filterType: 'glfx',
    group: 'filters'
  },

  // instantiate imageFilter widget list
  init: function imageFilter_init() {

    var imageFilter=this;
    var staticData=imageFilter.getStaticData();
        
    // extend default filter settings with specified ones
    var settings=$.extend(true,{},imageFilter.list[imageFilter.filterType][imageFilter.filter],imageFilter.settings);
    if (!settings.parameters) {
      throw "filter not found: "+imageFilter.filterType+'.'+imageFilter.filter;
    }

    // instantiate imageFilter parameter widgets and append to imageFilter container
    $.each(settings.parameters,function(widgetName,settings){
      var widget_container=$('<div class="parameter '+widgetName+'">');
      $(imageFilter.container).append(widget_container);

      staticData.widget.push(new ImageFilterWidget({
        imageFilter: imageFilter,
        name: widgetName,
        settings: settings
      }));
console.log(staticData.widget.length);
    });

    // append this imageFilter instance to static data 

    staticData[imageFilter.filterType].list.push(imageFilter);
    imageFilter.saveStaticData(staticData);

  }, // imageFilter_init

  dispose: function imageFilter_dispose()  {
    var imageFilter=this;

    // dispose of every widget
    $.each(imageFilter.widget,function(index,widget){
      widget.dispose();
    });

    // dispose of static data
    $(imageFilter.target).parent().removeData(imageFilter.group);

  }, // imageFilter_dispose

  saveStaticData: function imageFilter_saveStaticData(data) {
    var imageFilter=this;
    $(imageFilter.target).parent().data(imageFilter.group,data);    
  }, // imageFilter_saveStaticData

  // get or initialize imageFilter static data (shared between widgets of this.group)
  getStaticData: function imageFilter_getStaticData() {
    var imageFilter=this;
    return $(imageFilter.target).parent().data(imageFilter.group) || $.extend(true,{},imageFilter.staticData);
  }, // imageFilter_getStaticData

  
  // available filter types
  filterTypeAvailable: ['caman','glfx'],

  staticData: {

     widget: [],

     caman: {
      list: [],
      process: function(staticData,widget) {
        var caman=staticData.caman.instance;
        var canvas=$(widget.imageFilter.target)[0];
        var isupdate;
      
        if (!caman) {
          
          // copy original canvas
         
          var caman_canvas=document.createElement('canvas');
          $(caman_canvas).appendTo('body');
     
          caman_canvas.textureCopy=function(canvas) {
            var caman_canvas=this;  
            caman_canvas.width=canvas.width;
            caman_canvas.height=canvas.height;            
            var ctx=caman_canvas.getContext('2d');
            ctx.drawImage(canvas,0,0);
          }

          caman_canvas.textureCopy(canvas);

          // instantiate caman object
          caman=staticData.caman.instance=Caman(caman_canvas);
          caman.canvas=caman_canvas;
          isupdate=false;

        } else {
          // revert canvas content without updating display
//          caman.revert(false);
                    caman.reloadCanvasData();

          isupdate=true;
        }

        if (staticData.canvas_setup) {
          staticData.canvas_setup(caman.canvas,isupdate);
        }

        if (isupdate) {
          var oldStyle=caman.canvas.oldStyle;
          if (oldStyle) {
            if (
              oldStyle.left!=caman.canvas.style.left ||
              oldStyle.top!=caman.canvas.style.top ||
              oldStyle.width!=caman.canvas.style.width ||
              oldStyle.height!=caman.canvas.style.height
            ) {
              caman.canvasNeedsUpdate=true;
            }
          }
        }

        var style=caman.canvas.style;
        caman.canvas.oldStyle={
          left: style.left,
          top: style.top,
          width: style.width,
          height: style.height
        }

        if (caman.canvasNeedsUpdate) {
          caman.canvas.textureCopy($(widget.imageFilter.target)[0]);
          caman.reloadCanvasData();
          caman.canvasNeedsUpdate=false;
        }

        // apply filters
        $.each(staticData.caman.list,function(index,filter){

          function getParameterList(filter){
            var list=[];
            $.each(staticData.widget,function(){
                list.push(parseFloat(this.value,10)||0);                  
            });
            return list;
          }
         
          switch(filter.filter) {
            default:
              try {
//                    console.log(widget.name,widget.value);
                caman[filter.filter].apply(caman,getParameterList(filter));
              } catch(e) {}
              break;
          }
        });
        caman.render(function callback(){
        });
      },
    },

    glfx: {
      list: [],
      process: function(staticData,widget) {
        var glfx=staticData.glfx;
        var isupdate=(glfx.canvas);

        if (!isupdate) {
          glfx.canvas=fx.canvas();
        }

        if (staticData.canvas_setup) {
          staticData.canvas_setup(glfx.canvas,isupdate);
        }

        if (isupdate) {
          var oldStyle=glfx.canvas.oldStyle;
          if (oldStyle) {
            if (
              oldStyle.left!=glfx.canvas.style.left ||
              oldStyle.top!=glfx.canvas.style.top ||
              oldStyle.width!=glfx.canvas.style.width ||
              oldStyle.height!=glfx.canvas.style.height
            ) {
              glfx.texture.destroy();
              glfx.texture=null;
            }
          }
        }
        
        var style=glfx.canvas.style;
        glfx.canvas.oldStyle={
          left: style.left,
          top: style.top,
          width: style.width,
          height: style.height
        }

        if (!glfx.texture) {
          glfx.texture=glfx.canvas.texture($(widget.imageFilter.target)[0]);
        }

        var texture;
        $.each(staticData.glfx.list,function(index,filter){

          function getParameterList(filter){
            var list=[];
            $.each(staticData.widget,function(){
                if (this.imageFilter.filter==filter.filter) {
                  list.push(parseFloat(this.value,10)||0);
                }                  
            });
            return list;
          }

          switch(filter.filter) {
            default:
              try {

                 if (filter.disabled) {
                   return;
                 }

                // use resulting canvas texture for subsequent passes
                if (index) {
                  texture=glfx.canvas.contents();
                }

                (glfx.canvas.draw(texture||glfx.texture))[filter.filter].apply(glfx.canvas,getParameterList(filter)).update();

                if (texture) {
                  texture.destroy();
                }

              } catch(e) {
                console.log(e);
              }
              break;
          }
        });
      }
    }
  },

  // list of filters per filterType
  list: {


    // filterType
    caman: {

      // filter name
      brightness: {

        // filter parameters list
        parameters: {
       
          // filter parameter name and settings
          brightness: {
            min: -100,
            max: 100,
            step: 1
          }
        }
      },

      contrast: {
        parameters: {
          contrast: {
            min: -100,
            max: 100,
            step: 1
          }
        }
      },

      saturation: {
        parameters: {
          saturation: {           
            min: -100,
            max: 100,
            step: 1
          }
        }
      },

      vibrance: {
        parameters: {
          vibrance: {
            min: -100,
            max: 100,
            step: 1
          }
        }
      },

      exposure: {
        parameters: {
          exposure: {
            min: -100,
            max: 100,
            step: 1
          }
        }
      },

      hue: {
        parameters: {
          hue: { 
            min: 0,
            max: 100,
            step: 1
          }
        }
      },

      sepia: {
        parameters: {
          sepia: {
            min: 0,
            max: 100,
            step: 1
          }
        }
      },

      gamma: {
        parameters: {
          gamma: {
            min: 0,
            max: 10,
            step: 0.1
          }
        }
      },

      noise: {
        parameters: {
          noise: {
            min: 0,
            max: 100,
            step: 1
          }
        }
      },

      clip: {
        parameters: {
          clip: {
            min: 0,
            max: 100,
            step: 1
          }
        }
      },

      sharpen: {
        parameters: {
          sharpen: {
            min: 0,
            max: 100,
            step: 1
          }
        }
      },

      stackBlur: {
        parameters: {
          stackBlur: {
            min: 0,
            max: 20,
            step: 1
          }
        }
      }
      
    },

    glfx: {
      brightnessContrast: {
        parameters: {  
          brightness: {
            min: -1,
            max: 1,
            step: 0.02
          },
          contrast: {
            min: -1,
            max: 1,
            step: 0.02
          }
        }
      },

      denoise: {
        parameters: {
          denoise: {
            min: 0,
            max: 50,
            step: 0.5
          }
        }
      },

      hueSaturation: {
        parameters: {
          hue: {
            min: -1,
            max: 1,
            step: 0.05
          },
          saturation: {
            min: -1,
            max: 1,
            step: 0.05
          }
        }
      },

      sepia: {
        parameters: {
          sepia: {
            min: 0,
            max: 1,
            step: 0.01
          }         
        }
      },

      vibrance: {
        parameters: {
          vibrance: {
            min: -1,
            max: 1,
            step: 0.05
          }
        }
      },

      vignette: {
        parameters: {
          vignette: {
            min: 0,
            max: 1,
            step: 0.01
//            value: 0.2
          },
          amount: {
            min: 0,
            max: 1,
            step: 0.01
//            value: 0.7
          }
        }
      },

      unsharpMask: {
        parameters: {
          radius: {
            min: 0,
            max: 200,
            step: 1
          },
          
          strength: {
            min: 0,
            max: 5,
            step: 0.05
          }
        }
      }
    }

  } // filterSettings

});

 /**
 * ImageFilterWidget(options)
 *
 * ImageFilterWidget object constructor
 *
 * @param options.target  target canvas selector or element
 * @param options.type   widget type, defaults to 'slider'
 * @param options.container  widget dom container
 * @param options.filter  canman filter name (see ImageFilterWidget.filterSettings)
 *
 */

function ImageFilterWidget(options) {
  if (!(this instanceof ImageFilterWidget)) {
    return new ImageFilterWidget(options);
  }
  $.extend(true,this,this.defaults,options);
  this.init();
}

$.extend(true,ImageFilterWidget.prototype,{

  defaults: {
    type: 'slider'
  },

  init: function imageFilterWidget_init() {

    var widget=this;
        
    $('.'+widget.name,widget.imageFilter.container).html(widget.html[widget.type].call(widget));


    $('.'+widget.name+' input',widget.imageFilter.container)
    .off('.imageFilterWidget')
    .on('input.imageFilterWidget change.imageFilterWidget', widget.onchange)
    .closest('div.parameter')
    .data('imageFilterWidget',widget);

  },

  dispose: function imageFilterWidget_dispose() {
    $('.'+widget.name+' input',widget.imageFilter.container)
    .closest('div.parameter')
    .removeData('imageFilterWidget');

  }, // imageFilterWidget_dispose

  onchange: function imageFilterWidget_onchange(e){
    var div=$(e.target).closest('div.parameter');
    var widget=div.data('imageFilterWidget');
    var panel=$(div).closest('#imagefilters');

    var value=$(e.target).val();

    widget.value=value;    
    
    $('.parameter_value',div).text(widget.value);

    var staticData=widget.imageFilter.getStaticData();

    $.each(staticData,function() {
      var imageFilters=this;
      if (imageFilters.list && imageFilters.list.length && imageFilters.process) {
        imageFilters.process(staticData,widget);
      }
    });
        
  },
  
  html: {
      slider: function imageFilterWidget_sliderHtml() {
        var widget=this;
        var settings=widget.settings;
        return '<div class="parameter">'
        + '<span class="parameter_name">'
        + widget.name
        + '</span>'
        + '<span class="parameter_widget">'
        + '<input type="range" min="'+settings.min+'" max="'+settings.max+'" step="'+settings.step+'" value="'+(settings.value||0)+'" data-filter="'+widget.name+'">'
        + '<span class="parameter_value">'+(settings.value||0)+'</span>'
        + '</span>'
        + '</div>';
      }
  },
     

});
