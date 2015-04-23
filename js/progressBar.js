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

function ProgressBar(options) {
     
    if (!(this instanceof ProgressBar)) {
      return new ProgressBar(options);
    }
   
    var bar=this;      

    $.extend(true,bar,bar.defaults,options); 
    bar.init();
}


$.extend(true, ProgressBar.prototype, {
    
        defaults: {

          container: 'body',

          className: 'pbar',

          css: {
            zIndex: 9999999,
            width: '100%',
            bottom: 0,
            position: 'absolute'
          },

          text: {

            value: '',

            css: {
              position: 'absolute',    
              left: '50%',
              textAlign: 'center',
              zIndex: 99999999,   
              bottom: '-3px',
              color: 'black',
              fontSize: 'small'   
            }

          }

        }, // progressBar defaults
    
        // instantiate dom elements 
        init: function progressBar_init() {
          var bar=this;
          bar.elem=$('progress.'+bar.className,$(bar.container));
     
          if (!bar.elem.length) { 

            // instantiate progressbar
            bar.elem=$('<progress class="'+bar.className+'" '+(bar.max?('max="'+bar.max+'" value="'+bar.value):(''))+'"></progress>');
            bar.elem.appendTo($(bar.container));   
            bar.elem.css(bar.css);
    
            // instantiate text span 
            bar.span=$('<span class="'+bar.className+'">'+bar.text.value+'</span>');
            bar.span.appendTo($(bar.container));   
            bar.span.css(bar.text.css);
          }

        }, // progressBar_init    

        // set progress bar position (percentage)     
        set: function progressBar_set(value) {
          var bar=this;
          $(bar.elem).attr('value',value); 
          $(bar.span).text(bar.text.value+' '+Math.round(value*100)+'% ');
     
        },  // progressBar_set    

        // remove dom elements     
        dispose: function progressBar_dispose() {
          var bar=this;
          $(bar.span).remove();
          $(bar.elem).remove();
        }, // progressBar_dispose  
     
}); // ProgressBar.prototype
