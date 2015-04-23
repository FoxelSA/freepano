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
