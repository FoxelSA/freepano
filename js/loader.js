    // ajax using XMLHttpRequest level 1 http://www.w3.org/TR/XMLHttpRequest2/
    var ajax=function ajax(_request) {

      var request=$.extend(true,{
        type: 'GET',
        dataType: 'arraybuffer',
        mimeType: 'text/plain; charset=x-user-defined',
        async: true
      }, _request);

      try {
        var xhr=new XMLHttpRequest();

        // setup event handlers
        var event_type=['progress','load','error','abort'];
        $.each(event_type,function(i,handler_type){
          if (request[handler_type]) {
            xhr.addEventListener(handler_type,request[handler_type],false);
          }
        });

        // open asynchronous GET request by default
        xhr.open(request.type,request.url,request.async);
        if (request.type=='POST') {
          xhr.setRequestHeader("Content-type",request.contentType||"application/x-www-form-urlencoded");
        }

        // set default response type to arraybuffer
        xhr.overrideMimeType(request.mimeType);
        xhr.responseType=request.dataType;

        // send request
        xhr.send(request.data);

      } catch(e) {
        console.log(e);
        if (request.error) {
          request.error(e,xhr);
        }
      }

    } // ajax

    // loadData()
    //
    // Load data from url for given object, and trigger object 'load' or 'loaderror' event
    // Call object.progress onprogress, if defined.
    //
    // @param options.object        target prototype or instance
    // @param options.dataType      target data type
    // @param options.url           data url
    // @param options.responseType  xmlHttpRequest response type expected
    // @param options.mimeType      xmlHttpRequest response mime type expected
    // @param options.async         asynchronous request flag
    var loadData=function(options) {

      var o=$.extend(true,{
        responseType: 'arraybuffer',
        mimeType: 'text/plain; charset=x-user-defined',
        async: true
      }, options);

      ajax({

        url: o.url,
        responseType: o.responseType,
        mimeType: o.mimeType,
        async: o.async,

        progress: o.object.progress ?
          function ajax_progress(e){
            o.object.progress(e);
          } : null,

        // on 'error', trigger object 'loaderror' event
        error: function() {

          console.log('loading data from '+o.url+'... failed',arguments);

          if (o.object.progress) {
            o.object.progress(e);
          }

          // trigger 'loaderror' event
          if (o.object.dispatch) {
            o.object.dispatch({
              type: 'loaderror',
              dataType: o.dataType,
              url: o.url,
              arguments: Array.prototype.slice.call(arguments)
            });
          }
        }, // error

        // on 'load', trigger object 'load' or 'loaderror' event
        load: function(e){

          if (o.object.progress) {
            o.object.progress(e);
          }

          // failed ?, trigger 'loaderror' event
          if (e.target.responseType!="arraybuffer" || !e.target.response.byteLength) {
            console.log('loading data from '+o.url+'... failed');
            o.object.dispatch({
              type: 'loaderror',
              dataType: o.dataType,
              url: o.url,
              arguments: Array.prototype.slice.call(arguments)
            });
            return;
          }

          // success, trigger 'load' event
          console.log('loading data from '+o.url+'... done');
          o.object.dispatch({
            type: 'load',
            dataType: o.dataType,
            url: o.url,
            data: e.target.response
          });

        } // load

      }); // ajax

    } // loadData

