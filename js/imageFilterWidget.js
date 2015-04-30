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
    type: 'slider',
    filterType: 'caman',
    filterTypeAvailable: ['caman','glfx']
  },

  init: function imageFilterWidget_init() {

    var widget=this;
    widget.settings=widget.filterSettings[widget.filterType][widget.filter];
        
    $(widget.container).html(widget.html[widget.type].call(widget));

    // retrieve filters list and settings for target, if available
    var filters=$(widget.target).parent().data('filters')||{};

    if (!filters.widgets) {

      filters.widgets={        
        caman: {
          list: [],
          process: function(filters,widget) {
            if (!filters.widgets.caman.instance) {
              filters.widgets.caman.instance=Caman(widget.target);
            }
            var caman=filters.widgets.caman.instance;

            // revert canvas content without updating display
            caman.revert(false);

            // apply filters
            $.each(filters.widgets.caman.list,function(){
              var widget=this;
              switch(widget.filter) {
                default:
                  try {
//                    console.log(widget.filter,widget.value);
                    caman[widget.filter](parseInt(widget.value||0,10));
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
          process: function(filters,widget) {
            var glfx=filters.widgets.glfx;
            var isupdate=true;

            if (!glfx.canvas) {
              glfx.canvas=fx.canvas();
              isupdate=false;
            }
            
            if (filters.canvas_setup) {
              filters.canvas_setup(glfx.canvas,isupdate);
            }

            if (isupdate) {
              var oldStyle=glfx.canvas.oldStyle;
              if (oldStyle) {
                if (
                  oldStyle.left!=glfx.canvas.style.left ||
                  oldStyle.top!=glfx.canvas.style.top ||
                  oldStyle.width!=glfx.canvas.style.width ||
                  oldStyle.bottom!=glfx.canvas.style.bottom
                ) {
                  glfx.texture.destroy();
                  glfx.texture=null;
                }
              }
              

            } else {
              var style=glfx.canvas.style;
              glfx.canvas.oldStyle={
                left: style.left,
                top: style.top,
                width: style.width,
                height: style.height
              }

            }


            if (!glfx.texture) {
              glfx.texture=glfx.canvas.texture($(widget.target)[0]);
            }

            var texture;
            $.each(filters.widgets.glfx.list,function(index,widget){
  
              function getParameterList(filter){
                var list=[];
                $.each(filters.widgets.glfx.list,function(){
                  if (widget.settings.filterName==this.settings.filterName) {
                    list[this.settings.parameter_index]=parseFloat(this.value,10)||0;
                  }
                });
                return list;
              }

              switch(widget.filter) {
                default:
                  try {

                     if (widget.settings.parameter_index) {
                       return;
                     }
                    
                    // use resulting canvas texture for subsequent passes
                    if (index) {
                      texture=glfx.canvas.contents();
                    }

                    (glfx.canvas.draw(texture||glfx.texture))[widget.settings.filterName].apply(glfx.canvas,getParameterList()).update();
                    
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
      }
    }

    filters.widgets[widget.filterType].list.push(widget);
    $(widget.target).parent().data('filters',filters);

    $('input',widget.container)
    .off('.imageFilterWidget')
    .on('input.imageFilterWidget change.imageFilterWidget', widget.onchange)
    .closest('div.filter')
    .data('imageFilterWidget',widget);

  },

  onchange: function imageFilterWidget_onchange(e){
    var div=$(e.target).closest('div.filter');
    var widget=div.data('imageFilterWidget');
    var panel=$(div).closest('#imagefilters');

    var value=$(e.target).val();

    widget.value=value;    
    
    $('.filtervalue',div).text(widget.value);

    var filters=$(widget.target).parent().data('filters');

    $.each(widget.filterTypeAvailable,function(i,type) {
      if (filters.widgets[type].list.length) {
        filters.widgets[type].process(filters,widget);
      }
    });
        
  },
  
  html: {
      slider: function imageFilterWidget_sliderHtml() {
        var widget=this;
        var settings=widget.settings;
        return '<div class="filter">'
        + '<div class="filtername">'
        + '<p>'+widget.filter+'</p>'
        + '</div>'
        + '<div class="filtersetting">'
        + '<input type="range" min="'+settings.min+'" max="'+settings.max+'" step="'+settings.step+'" value="'+(settings.value||0)+'" data-filter="'+widget.filter+'">'
        + '<span class="filtervalue">'+(settings.value||0)+'</span>'
        + '</div>'
        + '</div>';
      }
  },
     
  filterSettings: {

    caman: {
      brightness: {
        min: -100,
        max: 100,
        step: 1
      },
      contrast: {
        min: -100,
        max: 100,
       step: 1
      },
      saturation: {
        min: -100,
        max: 100,
        step: 1
      },
      vibrance: {
        min: -100,
        max: 100,
        step: 1
      },
      exposure: {
        min: -100,
        max: 100,
        step: 1
      },
      hue: {
        min: 0,
        max: 100,
        step: 1
      },
      sepia: {
        min: 0,
        max: 100,
        step: 1
      },
      gamma: {
        min: 0,
        max: 10,
        step: 0.1
      },
      noise: {
        min: 0,
        max: 100,
        step: 1
      },
      clip: {
        min: 0,
        max: 100,
        step: 1
      },
      sharpen: {
        min: 0,
        max: 100,
        step: 1
      },
      stackBlur: {
        min: 0,
        max: 20,
        step: 1
      }
    },

    glfx: {
      brightness: {
        min: -1,
        max: 1,
        step: 0.02,
        parameter_index: 0,
        filterName: 'brightnessContrast'

      },
      contrast: {
        min: -1,
        max: 1,
        step: 0.02,
        parameter_index: 1,
        filterName: 'brightnessContrast'
      },
      denoise: {
        min: 0,
        max: 50,
        step: 0.5,
        parameter_index: 0,
        filterName: 'denoise'

      }  
    }

  } // filterSettings

});
