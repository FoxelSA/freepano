/*
 *   selrect - jquery plugin implementing selection rectangle
 *   
 *   Copyright (C) 2010-2015 Luc Deschenaux - luc.deschenaux(a)freesurf.ch
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Example:
 * $('.container').selrect(selrect_callback);
 * $('.selrect').css({background:"#ccddee", opacity:"0.3"}) // (optional)
 *
*/

(function($) {

  var selrect = function SelRect(options) {

    if (!(this instanceof selrect)) {
      return new selrect(options);
    }

    var self=this;

    this.defaults={
      className: 'selrect',
      css: {
         zIndex: 9999,
         display: 'block',
         width: 1,
         height: 1
      },
      resizable: false,
      persistent: false
    };

    $.extend(true,this,this.defaults,options);

    this.init=function init() {

      this.persistent=this.persistent||this.resizable;

      if (this.container.getElementsByClassName(this.className).length) {
        throw("selrect: already initialized");
      }

      var div=this.div=document.createElement('div');
      div.className=this.className;
      div.style.display="none";
      div.style.position="absolute";
      div.style.border="1px solid black";
      div.style.borderStyle="dashed";
      $(this.container).append(div);
      $(this.container).on('mousedown.selrect', this.mousedown);
      self.event={};
      this.callback('init');
      
    } // selrect_init
       
    this.onmousedown=function mousedown(event) {

      event.preventDefault();
      event.stopPropagation();

      // left button or nothing
      if (event.button!=0) return;

//      this.resizing=$(self.div).is(':visible');

      var x,y;
      x=event.pageX;
      y=event.pageY;
      self.event=event;

      if (self.callback(event)===false) {
        return false;
      }

      self.xorig=x;
      self.yorig=y;
      self.moving=false;
      
      $(document).on('mousemove.selrect', self.mousemove);
      $(document).on('mouseup.selrect', self.mouseup);

    }

    this.onmousemove=function mousemove(event) {

      if (self.resizing) {
        function isMouseOver(elem,e){
          var o=elem.offset();
          return (
            e.pageX >= o.left && 
            e.pageX <= o.left+elem.outerWidth() &&
            e.pageY >= o.top &&
            e.pageY <= o.top+elem.outerHeight()
          );
        }


        return;
      }
   
      var x=event.pageX;                                                        
      var y=event.pageY;                                                        
      if (!self.moving) {

        if (!(Math.abs(self.xorig-x)>4 || Math.abs(self.yorig-y)>4)) return;

        if (self.callback("selstart")===false) {
          return;
        }

        $(self.div).css($.extend(self.css,{
          top: self.xorig,
          left: self.yorig
        }));

        self.moving=true; 
      }

      self.event=event;
      self.rect={};

      var w=x-self.xorig;
      if (w<0) {
        self.rect.left=x;
        self.rect.width=-w;
      } else {
        self.rect.left=self.xorig;
        self.rect.width=w;
      }
      
      var h=y-self.yorig;
      if (h<0) {
        self.rect.top=y;
        self.rect.height=-h;
      } else {
        self.rect.top=self.yorig;
        self.rect.height=h;
      }

      $(self.div).css({
          left: self.rect.left,
          top: self.rect.top,
          width: self.rect.width,
          height: self.rect.height
      });

      return self.callback(event);

    }

    this.onmouseup=function mouseup(event) {

      self.event=event;
      
      $(document).off('mousemove.selrect',selrect.mousemove);
      $(document).off('mouseup.selrect',selrect.mouseup);

      if (self.moving) {

        if (!self.persistent) {
          $(self.div).css({
            display: 'none'
          });
        }

        self.moving=false;

        var ret=self.callback(event);

        if (self.resizable && !self.resizing) {
          self.resizing=true;
          $(self.div).on('mousemove.selrect',selrect.ondivmousemove);
          $(self.div).on('mousedown.selrect',selrect.ondivmousedown);

          self.updateBorder();
          self.updateHandles();
          
        }
      
        return ret;
      }
    }

    /**
     * selrect.ondivmousemove()
     */
    this.ondivmousemove=function ondivmousemove(e) {
      console.log(e.pageX,e.pageY);

    }
/*
    this.updateBorder=function() updateBorder{
      if (!self.blackBorders) return;
    }

    this.updateHandles=function() {
      if (!self.handles) {
        var handle=self.handles={};
        var o=$(self.div).offset();
        var w=$(self.div).outerWidth();
        var h=$(self.div).innerWidth();

        // topleft
        var div=document.createElement('div');
        div.css({

        });


      }
    }
    */


    this.init();
  }

  $.fn.selrect=function(options) {
    var instance;
    this.each(function () {
      instance=new selrect($.extend(true,{
          container: this
      },options));
      $(this).data('selrect',instance);
    });
    if (this.length==1) {
      this.selrect=instance;
    }
    return this;
  };

}) (jQuery);

