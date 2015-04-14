!function() {

	var URL = window.URL || window.webkitURL;
	if (!URL) {
		throw new Error('This browser does not support Blob URLs');
	}

	if (!window.Worker) {
		throw new Error('This browser does not support Web Workers');
	}

	// Multithread object constructor
	function Multithread(threads) {
		if (!(this instanceof Multithread)) {
			return new Multithread(threads);
		}
		this.threads = Math.max(navigator.hardwareConcurrency || 2, threads | 0);
		this._queue = [];
		this._activeThreads = 0;
		this._debug = {
			start: 0,
			end: 0,
			time: 0
		};
	}

	// web worker templates used by _prepare
	Multithread.prototype._workerTemplate = {
		json: function() {
			
			var /**/name/**/ = (/**/func/**/);
			
			self.addEventListener('message', function(e) {
				
				// decode message
				var data = e.data;
				var view = new DataView(data);
				var len = data.byteLength;
				var str = Array(len);
				for (var i=0;i<len;i++) {
					str[i] = String.fromCharCode(view.getUint8(i));
				}
				var args = JSON.parse(str.join(''));

				// process message
				var value = (/**/name/**/).apply(/**/name/**/, args);
				
				// process response
				try {
					data = JSON.stringify(value);
				} catch(e) {
					throw new Error('This function must return JSON serializable response');
				}
				len = typeof(data)==='undefined'?0:data.length;
				var buffer = new ArrayBuffer(len);
				view = new DataView(buffer);
				for (i=0;i<len;i++) {
					view.setUint8(i, data.charCodeAt(i) & 255);
				}

				// send response and kill worker
				self.continue=false;
				self.postMessage(buffer, [buffer]);
				self.close();
			})
		},

		int32: function() {
			var /**/name/**/ = (/**/func/**/);
			self.addEventListener('message', function(e) {
				var data = e.data;
				var view = new DataView(data);
				var len = data.byteLength / 4;
				var arr = Array(len);
				for (var i=0;i<len;i++) {
					arr[i] = view.getInt32(i*4);
				}
				var value = (/**/name/**/).apply(/**/name/**/, arr);
				if (!(value instanceof Array)) { value = [value]; }
				len = value.length;
				var buffer = new ArrayBuffer(len * 4);
				view = new DataView(buffer);
				for (i=0;i<len;i++) {
					view.setInt32(i*4, value[i]);
				}
				self.continue=false;
				self.postMessage(buffer, [buffer]);
				self.close();
			})
		},

		float64: function() {
			var /**/name/**/ = (/**/func/**/);
			self.addEventListener('message', function(e) {
				var data = e.data;
				var view = new DataView(data);
				var len = data.byteLength / 8;
				var arr = Array(len);
				for (var i=0;i<len;i++) {
					arr[i] = view.getfloat64(i*8);
				}
				var value = (/**/name/**/).apply(/**/name/**/, arr);
				if (!(value instanceof Array)) { value = [value]; }
				len = value.length;
				var buffer = new ArrayBuffer(len * 8);
				view = new DataView(buffer);
				for (i=0;i<len;i++) {
					view.setFloat64(i*8, value[i]);
				}
				self.continue=false;
				self.postMessage(buffer, [buffer]);
				self.close();
			})
		},

		buffer: function() {
			var /**/name/**/ = (/**/func/**/);
			self.addEventListener('message', function(e){
				var buffer=(/**/name/**/).apply(/**/name/**/, [e.data]);
				self.continue=false;
				self.postMessage(buffer, [buffer]);
				self.close();
			})
		},

		transferable: function(){
			var /**/name/**/ = (/**/func/**/);
			self.addEventListener('message', function(e){
				var reply=(/**/name/**/).apply(/**/name/**/, [e.data]);
				if (!Array.isArray(reply)) {
					reply=[reply];
				}
				self.continue=false;
				self.postMessage(reply[0], reply[1]);
				self.close();
			})
		}

	};

	// Copy worker argument list into an ArrayBuffer for specified types
	// before sending them to the worker with postMessage()
	// (slower than using 'buffer' or 'transferable' worker types)
	Multithread.prototype._argsEncode = {
		json: function(args) {
			try {
				var data = JSON.stringify(args);
			} catch(e) {
				throw new Error('Arguments provided to this function must be JSON serializable');
			}
			len = data.length;
			var buffer = new ArrayBuffer(len);
			var view = new DataView(buffer);
			for (var i=0;i<len;i++) {
				view.setUint8(i, data.charCodeAt(i) & 255);
			}
			return buffer;
		},
		int32: function(args) {
			len = args.length;
			var buffer = new ArrayBuffer(len*4);
			var view = new DataView(buffer);
			for (var i=0;i<len;i++) {
				view.setInt32(i*4, args[i]);
			}
			return buffer;
		},
		float64: function(args) {
			len = args.length;
			var buffer = new ArrayBuffer(len*8);
			var view = new DataView(buffer);
			for (var i=0;i<len;i++) {
				view.setFloat64(i*8, args[i]);
			}
			return buffer;
		}
	};

	// Decode worker message events data before running callback,
	// for specified worker types
	// (slower than using 'buffer' or 'transferable' worker types)
	Multithread.prototype._argsDecode = {
		json: function(data) {
			var view = new DataView(data);
			var len = data.byteLength;
			var str = Array(len);
			for (var i=0;i<len;i++) {
				str[i] = String.fromCharCode(view.getUint8(i));
			}
			if (!str.length) {
				return;
			} else {
				return JSON.parse(str.join(''));
			}
		},
		int32: function(data) {
			var view = new DataView(data);
			var len = data.byteLength / 4;
			var arr = Array(len);
			for (var i=0;i<len;i++) {
				arr[i] = view.getInt32(i*4);
			}
			return arr;
		},
		float64: function(data) {
			var view = new DataView(data);
			var len = data.byteLength / 8;
			var arr = Array(len);
			for (var i=0;i<len;i++) {
				arr[i] = view.getFloat64(i*8);
			}
			return arr;
		},
	};

	// setup and run worker, or append to queue if thread limit is reached
	Multithread.prototype._execute = function(options){

		var multithread=this;

		// check whether thread limit is reached
		if (multithread._activeThreads >= multithread.threads) {
			// enqueue
			this._queue.push(options);
			return;
		}

		if (!multithread._activeThreads) {
			multithread._debug.start = (new Date).valueOf();
		}

		multithread._activeThreads++;

		// instantiate worker
		var worker = new Worker(options.url);
		worker.multithread=multithread;
		worker.callback=options.callback;
		worker.type=options.type;
		worker.decode=multithread._argsDecode[worker.type];
		worker.continue=true;

		// encode worker arguments if needed
		var msg = multithread._argsEncode[worker.type] ? multithread._argsEncode[worker.type](options.args) : options.args[0];

		// setup message event handler in main thread for this worker
		var onmessage=options.onmessage;
		if (!onmessage) {  
			onmessage = function(e){
				var worker=this;
				worker.callback.apply(worker, worker.decode ? [worker.decode(e.data)] : [e.data]);
				if (!worker.continue) {
					worker.multithread.ready();
				}
			};
		}
		worker.addEventListener('message', onmessage);

		// setup error event handler in main thread for this worker
		if (options.onerror) {
			worker.addEventListener('error', options.onerror);
		}

		var transferable_list;
		if (options.type == 'transferable') {
			transferable_list=options.args[1];
		} else {
			transferable_list=[msg];
		}

		// start worker
		worker.postMessage(msg, transferable_list);
	};

	// run next worker in queue, if any
	Multithread.prototype.ready = function() {
		this._activeThreads--;
		if (this._queue.length) {
			this._execute.apply(this, [this._queue.shift()]);
		} else if (!this._activeThreads) {
			this._debug.end = (new Date).valueOf();
			this._debug.time = this._debug.end - this._debug.start;
		}
	};

	// create worker object url
	// after merging template and worker function source code
	Multithread.prototype._prepare=function(worker, type){

		var name = worker.name;
		var workerString = worker.toString();
		if (!name) {
			name = '$' + ((Math.random()*10)|0);
			while (workerString.indexOf(name) !== -1) {
				name += ((Math.random()*10)|0);
			}
		}

		var script = this._workerTemplate[type]
			.toString()
			.replace(/^.*?[\n\r]+/gi, '')
			.replace(/\}[\s]*$/, '')
			.replace(/\/\*\*\/name\/\*\*\//gi, name)
			.replace(/\/\*\*\/func\/\*\*\//gi, workerString);

		var workerURL = URL.createObjectURL(new Blob([script], {type:'text/javascript'}));

		return workerURL;

	};

	// setup a new worker
	Multithread.prototype.process = function(options){

		if (getParamNames(options.worker).length>2) {
			options.type = options.type || 'json';
		} else {
			options.type = options.type || 'transferable';
		}

		var workerURL = this._prepare(options.worker, options.type);
		var self = this;

		return function(){
			self._execute({
				url: workerURL,
				args: Array.prototype.slice.call(arguments),
				type: options.type,
				callback: options.callback
			});
		};

	};

	var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
	var ARGUMENT_NAMES = /([^\s,]+)/g;
	function getParamNames(func) {
		var fnStr = func.toString().replace(STRIP_COMMENTS, '');
		var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
		if (result === null)
			 result = [];
		return result;
	}

	window['Multithread'] = Multithread;

}();
