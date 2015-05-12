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

Panorama.prototype.gallery = {

   // object type for event dispatcher
   object_type: 'gallery',

   container: 'body',
   margin: 8,

   on_panorama_init: function gallery_on_panorama_init(e) {
      var panorama=this;
      // reference panorama for gallery events receivers
      panorama.gallery.panorama=panorama;
   
   }, // gallery_on_panorama_init

   show: function gallery_show(canvas) {
   
     var gallery=this;

     gallery.showOverlay();
      
     gallery.copyCanvas(canvas);
     gallery.centerAndFitCanvas();

     gallery.dispatch({
       type: 'show',
       canvas: canvas
     });
   
   }, // gallery_show

   showOverlay: function gallery_showOverlay() {
     var gallery=this;

     if (gallery.overlay) {
         gallery.overlay.show(0);
         $('.gallery',gallery.container).show(0);

     } else {

         gallery.initOverlay();
         gallery.initEventHandlers();
     }

   }, // gallery_showOverlay

   initOverlay: function gallery_initOverlay() {

     var gallery=this;

     gallery.overlay=$('<div class="gallery_overlay">').appendTo(gallery.container).css({
       backgroundColor: 'rgba(0,0,0,0.8)',
       position: 'absolute',
       width: '100%',
       height: '100%',
       top: 0,
       left: 0
     });

     gallery.closeButton=$('<a class="gallery_close">').css({
       position: 'absolute',
       top: 10,
       right: 16,
       fontSize: '3em',
       zIndex: 3,
     }).append($('<div class="fa fa-close">').css({
       color: 'grey',
       transition: 'all 0.2s ease-in',
       textAlign: 'center'
     }).on('click.gallery',function(e){
       gallery.hide();
     })
     .hover(function(e){

         if (e.type=='mouseenter') {
             $(this).css({
                 color: 'white'
             })

         } else {
             $(this).css({
                 color: 'gray'
             })
         } 

     }));
     

     gallery.leftArrow=$('<a class="fa fa-angle-left">').css({
        position: 'absolute',
        height: '10em',
        lineHeight: '10em',
        width: '50%',
        top: -99999,
        bottom: -99999,
        left: 0,
        paddingLeft: '1em',
        margin: 'auto',
        color: 'grey',
        backgroundColor: 'rgba(0,0,0,0)',
        fontSize: '6em',
 //       border: '1px solid white',
        verticalAlign: 'top',
        transition: 'all 0.2s ease-in',
        cursor: 'pointer',
        zIndex: 2 
     
      }).hover(function(e){ 
         $(this).css({
             color: (e.type=="mouseenter" && !$(e.target).hasClass('disabled'))?'white':'grey'
         });
         $(this.opposite).css({
             color: (e.type=="mouseenter" || (e.type!="mouseenter" && $(this.opposite).hasClass('disabled')))?'grey':'white'
         });


     }).on('click.gallery',function(e){

       var leftArrow=$(e.target);

       if (leftArrow.hasClass('disabled')) {
         return false;
       }

       gallery.dispatch('prev');

       if (leftArrow.hasClass('disabled')) {
          leftArrow.css('color','grey');
       }

       return false;

     });

     gallery.rightArrow=$('<a class="fa fa-angle-right">').css({
        position: 'absolute',
        height: '10em',
        width: '50%',
        lineHeight: '10em',
        top: -99999,
        bottom: -99999,
        right: 0,
        paddingRight: '1em',
        margin: 'auto',
        color: 'grey',
        backgroundColor: 'rgba(0,0,0,0)',
        fontSize: '6em',
//              border: '1px solid white',
        verticalAlign: 'top',
        textAlign: 'right',
        transition: 'all 0.2s ease-in',
        cursor: 'pointer',
        zIndex: 2 
     }).hover(function(e){
         $(this).css({
             color: (e.type=="mouseenter" && !$(e.target).hasClass('disabled'))?'white':'grey'
         });

     }).on('click.gallery',function(e){

       var rightArrow=$(e.target);
       
       if (rightArrow.hasClass('disabled')) {
         return false;
       }

       gallery.dispatch('next');

       if (rightArrow.hasClass('disabled')) {
           rightArrow.css('color','grey');
       }

       return false;

     });

     gallery.leftArrow[0].opposite=gallery.rightArrow;
     gallery.rightArrow[0].opposite=gallery.leftArrow
     gallery.overlay.append(gallery.leftArrow);
     gallery.overlay.append(gallery.rightArrow);
     gallery.overlay.append(gallery.closeButton);

   }, // gallery_initOverlay

   hide: function gallery_hide() {
     var gallery=this;
     $('.gallery',gallery.container).hide(0);
     gallery.overlay.hide(0);
     $('#snapshot_toggle').show(0);
     gallery.dispatch('hide');
   }, // gallery_hide

   initEventHandlers: function gallery_initEventHandlers() {
       var gallery=this;
       $(gallery.container).on('mousemove.gallery click.gallery',function(e){
           return gallery.dispatch(e);
       });

   }, // gallery_initEventHandlers

   onmousemove: function gallery_onmousemove(e) {
       var gallery=this;
    //   console.log(e);
   }, // gallery_onmousemove

   onclick: function gallery_onclick(e) {
       var gallery=this;

   }, // gallery_onclick

   // copy specified canvas in the gallery.canvas
   copyCanvas: function gallery_copyCanvas(canvas) {

     var gallery=this;

     if (!gallery.canvas) {
       gallery.initCanvas();
     }

     gallery.canvas.width=canvas.width;
     gallery.canvas.height=canvas.height;
     var ctx=gallery.canvas.getContext('2d');
     ctx.drawImage(canvas,0,0);

   }, // gallery_copyCanvas

   initCanvas: function gallery_initCanvas() {
     var gallery=this;
     gallery.canvas=document.createElement('canvas');
     gallery.canvas.className='gallery';
     $(gallery.canvas).css({
         cursor: 'pointer'
     }).hover(function(e){
       if (e.type=='mouseenter' && !gallery.rightArrow.hasClass('disabled')) {
          $(gallery.rightArrow).css('color','white');
       }
     });

     $('<div class="gallery">')
     .append(gallery.canvas)
     .appendTo(gallery.container);

   }, // gallery_initCanvas

   // set gallery canvas dimensions and position
   // according to source canvas and container dimensions 
   centerAndFitCanvas: function gallery_centerAndFitCanvas() {

     var gallery=this;
     var canvas=gallery.canvas;
     var container=$(gallery.container);

     var canvasRatio=canvas.width/canvas.height;
     var containerRatio=$(gallery.container).innerWidth()/$(gallery.container).innerHeight();
     
     var width, height;
     if (canvasRatio>1) {
       
       width=Math.min(container.width()-gallery.margin,canvas.width);
       height=width/canvasRatio;

       if (height>container.height()-gallery.margin) {
         height=container.height()-gallery.margin;
         width=height*canvasRatio;
       }

     } else {

       height=Math.min(container.height()-gallery.margin,canvas.height);
       width=height*canvasRatio;

       if (width>container.width()-gallery.margin) {
         width=container.width()-gallery.margin;
         height=width/canvasRatio;
       }
     }

     $(canvas).add($(canvas).parent()).css({
       position: 'absolute',
       width: width,
       height: height,
       top: -99999,
       bottom: -99999,
       left: -99999,
       right: -99999,
       margin: 'auto'
    });

   } // gallery_centerAndFitCanvas

} // gallery
 
// allow triggering gallery events, allow other objects to subscribe to gallery events
setupEventDispatcher(Panorama.prototype.gallery);

// gallery must subscribe to receive panorama events
Panorama.prototype.dispatchEventsTo(Panorama.prototype.gallery);

