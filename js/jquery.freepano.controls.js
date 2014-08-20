/*
 * freepano - WebGL panorama viewer
 *
 * Copyright (c) 2014 FOXEL SA - http://foxel.ch
 * Please read <http://foxel.ch/license> for more information.
 *
 *
 * Author(s):
 *
 *      Alexandre Kraft <a.kraft@foxel.ch>
 *
 *
 * Contributor(s):
 *
 *      Nils Hamel <n.hamel@foxel.ch>
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
 * Controls constructor
 */
function Controls(options) {

    if (!(this instanceof Controls))
        return new Controls(options);

    $.extend(true,this,this.defaults,options);
    this.init();

}

/**
 * Extends Controls prototype
 */
$.extend(true,Controls.prototype, {

    // default values
    defaults: {

        // touch
        touch: {
            zoom: {
                active: false,
                step: null  // value, or [null] meaning the same as panorama.camera.zoom.step
            },
            internal: {
                pinch: null,
                hammer: null
            }
        },

        // keyboard
        keyboard: {
            move: {
                active: false,
                step: 0.5
            },
            zoom: {
                active: false,
                step: null  // value, or [null] meaning the same as panorama.camera.zoom.step
            }
        },

        // device motion
        devicemotion: {
            move: {
                active: false
            },
            internal: {
                ticks: {
                    nth: 5,             // every nth event ticks
                    threshold: 100,     // maximum elapsed time (ms.) between ticks
                    count: 0,           // [internal]
                    time: 0             // [internal]
                },
                orientation: {
                    threshold: 0.05,    // rotation rate noise
                    lon: 0,             // [internal]
                    lat: 0              // [internal]
                },
                gravity: {
                    nth: 32,            // gravity alignment during nth ticks
                    count: 0,           // [internal]
                    aligned: false,     // [internal]
                    sign: 1,            // [internal] -1/+1 following device orientation
                    acceleration: {
                        x: 0,           // [internal]
                        y: 0,           // [internal]
                        z: 0            // [internal]
                    }
                }
            }
        }

    },

    // init() method
    init: function controls_init() {

        var controls = this;

        // orientation
        controls.orientation_detect();
        $(window).on('resize', function(e) {
            controls.orientation_detect();
            controls.devicemotion.internal.gravity.aligned = false;
        });
        $(window).on('orientationchange', function(e) {
            controls.devicemotion.internal.gravity.aligned = false;
        });

        // devicemotion
        controls._init_devicemotion();

        // panorama ready
        $(controls.panorama.container).on('ready',function() {

            // touch
            controls._init_touch();

            // keyboard
            controls._init_keyboard();

        });

        // callback!
        controls.callback();

    },

    // panorama_init() method
    panorama_init: Panorama.prototype.init,

    // orientation
    orientation: {
        portrait: false,
        landscape: true,
    },

    // orientation_detect() method
    orientation_detect: function() {
        this.orientation.portrait = ($(window).width() < $(window).height());
        this.orientation.landscape = !this.orientation.portrait;
    },

    // gravity_alignment() method
    gravity_alignment: function(acc) {

        // accumulation
        this.devicemotion.internal.gravity.acceleration.x += acc.x;
        this.devicemotion.internal.gravity.acceleration.y += acc.y;
        this.devicemotion.internal.gravity.acceleration.z += acc.z;

        // limit
        this.devicemotion.internal.gravity.count++;
        if (this.devicemotion.internal.gravity.count <= this.devicemotion.internal.gravity.nth)
            return;

        // average acceleration
        this.devicemotion.internal.gravity.acceleration.x /= this.devicemotion.internal.gravity.nth;
        this.devicemotion.internal.gravity.acceleration.y /= this.devicemotion.internal.gravity.nth;
        this.devicemotion.internal.gravity.acceleration.z /= this.devicemotion.internal.gravity.nth;

        // norm
        var norm = Math.sqrt(this.devicemotion.internal.gravity.acceleration.x * this.devicemotion.internal.gravity.acceleration.x
                           + this.devicemotion.internal.gravity.acceleration.y * this.devicemotion.internal.gravity.acceleration.y
                           + this.devicemotion.internal.gravity.acceleration.z * this.devicemotion.internal.gravity.acceleration.z);

        // sign per orientation
        if (this.orientation.portrait) {
            this.devicemotion.internal.gravity.sign
                = Math.sign(this.devicemotion.internal.gravity.acceleration.y) >= 0 ? 1 : -1;
        } else {
            this.devicemotion.internal.gravity.sign
                = Math.sign(this.devicemotion.internal.gravity.acceleration.x) >= 0 ? -1 : 1;
        }

        // longitude
        this.devicemotion.internal.orientation.lon = this.panorama.lon;
        this.devicemotion.internal.orientation.lat = Math.asin(this.devicemotion.internal.gravity.acceleration.z / norm) * (180 / Math.PI);

        // reset internals
        this.devicemotion.internal.gravity.count = 0;
        this.devicemotion.internal.gravity.acceleration = {x:0,y:0,z:0};

        // gravity set
        this.devicemotion.internal.ticks.time = 0;
        this.devicemotion.internal.gravity.aligned = true;
    },

    // [private] _init_touch() method
    _init_touch: function() {

        var controls = this;

        // touch move
        if (controls.touch.move.active)
            controls._register_touch_move(controls);

        // touch zoom
        if (controls.touch.zoom.active)
            controls._register_touch_zoom(controls);

        // watch touch move properties
        watch(controls.touch.move,['active'], function() {
            if (controls.touch.move.active)
                controls._register_touch_move(controls);
            else
                controls._unregister_touch_move(controls);
        });

        // watch touch zoom properties
        watch(controls.touch.zoom,['active'], function() {
            if (controls.touch.zoom.active)
                controls._register_touch_zoom(controls);
            else
                controls._unregister_touch_zoom(controls);
        });

        // zoom step
        if (controls.touch.zoom.step == null)
            controls.touch.zoom.step = controls.panorama.camera.zoom.step;

    },

    // [private] _register_touch() method
    _register_touch: function(controls) {

        // keep a reference to controls
        window._freepano_controls = controls;

        // instanciate hammer.js
        if (controls.touch.internal.hammer == null)
            controls.touch.internal.hammer = new Hammer($('canvas:first',controls.panorama.container).get(0));

    },

    // [private] _register_touch_move() method
    _register_touch_move: function(controls) {

        controls._register_touch(controls);

        // activate event
        controls.touch.internal.hammer.get('pan').set({enable:true});

        // register events
        controls.touch.internal.hammer.on('panstart',controls._touch_move_panstart);
        controls.touch.internal.hammer.on('panmove',controls._touch_move_panmove);
    },

    // [private] _unregister_touch_move() method
    _unregister_touch_move: function(controls) {

        // unregister events
        controls.touch.internal.hammer.off('panmove',controls._touch_move_panmove);
        controls.touch.internal.hammer.off('panstart',controls._touch_move_panstart);

        // desactivate event
        controls.touch.internal.hammer.get('pan').set({enable:false});
    },

    // [private] _register_touch_zoom() method
    _register_touch_zoom: function(controls) {

        controls._register_touch(controls);

        // activate event
        controls.touch.internal.hammer.get('pinch').set({enable:true});

        // register event
        controls.touch.internal.hammer.on('pinch',controls._touch_zoom);

    },

    // [private] _unregister_touch_zoom() method
    _unregister_touch_zoom: function(controls) {

        // unregister event
        controls.touch.internal.hammer.off('pinch',controls._touch_zoom);

        // desactivate event
        controls.touch.internal.hammer.get('pinch').set({enable:false});

    },

    // [private] _touch_move_panstart() method
    _touch_move_panstart: function(e) {

        var controls = window._freepano_controls;
        if (!controls.touch.move.active)
            return;

        if (controls.panorama.mode.mousedown)
            return; // do not interfere with mouse events

        // impersonate mouse properties
        e.clientX = e.center.x;
        e.clientY = e.center.y;

        // keep position
        controls.panorama.mousedownPos = {
            lon: controls.panorama.lon,
            lat: controls.panorama.lat,
            mouseCoords: controls.panorama.getMouseCoords(e),
            textureCoords: controls.panorama.worldToTextureCoords(controls.panorama.mouseCoords)
        };

    },

    // [private] _touch_move_panmove() method
    _touch_move_panmove: function(e) {

        var controls = window._freepano_controls;
        if (!controls.touch.move.active)
            return;

        if (controls.panorama.mode.mousedown)
            return; // do not interfere with mouse events

        if (!controls.panorama.sphere.done)
            return; // not ready

        // impersonate mouse properties
        e.clientX = e.center.x;
        e.clientY = e.center.y;

        // mouse coordinates
        var coords = controls.panorama.getMouseCoords(e);

        // set panorama coordinates
        controls.panorama.lon = controls.panorama.mousedownPos.lon-(coords.lon-controls.panorama.mousedownPos.mouseCoords.lon);
        controls.panorama.lat = controls.panorama.mousedownPos.lat-(coords.lat-controls.panorama.mousedownPos.mouseCoords.lat);

        // draw
        controls.panorama.drawScene();

    },

    // [private] _touch_zoom() method
    _touch_zoom: function(e) {

        var controls = window._freepano_controls;
        if (!controls.touch.zoom.active)
            return;

        // initial scale
        if (controls.touch.internal.pinch == null) {
            controls.touch.internal.pinch = e.scale;
            return;
        }

        // direction
        var sign = controls.touch.internal.pinch > e.scale ? 1 : -1;

        // zoom
        controls.panorama.camera.zoom.current += sign * (controls.touch.zoom.step / 5);
        controls.panorama.zoomUpdate();

    },

    // [private] _init_keyboard() method
    _init_keyboard: function() {

        var controls = this;

        // keyboard move
        if (controls.keyboard.move.active)
            controls._register_keyboard_move(controls);

        // keyboard zoom
        if (controls.keyboard.zoom.active)
            controls._register_keyboard_zoom(controls);

        // watch keyboard move properties
        watch(controls.keyboard.move,['active'], function() {
            if (controls.keyboard.move.active)
                controls._register_keyboard_move(controls);
            else
                controls._unregister_keyboard_move(controls);
        });

        // watch keyboard zoom properties
        watch(controls.keyboard.zoom,['active'], function() {
            if (controls.keyboard.zoom.active)
                controls._register_keyboard_zoom(controls);
            else
                controls._unregister_keyboard_zoom(controls);
        });

        // zoom step
        if (controls.keyboard.zoom.step == null)
            controls.keyboard.zoom.step = controls.panorama.camera.zoom.step;

    },

    // [private] _register_keyboard_move() method
    _register_keyboard_move: function(controls) {
        $(document).on('keydown',{controls: controls},controls._keyboard_move);
    },

    // [private] _unregister_keyboard_move() method
    _unregister_keyboard_move: function(controls) {
        $(document).off('keydown',controls._keyboard_move);
    },

    // [private] _register_keyboard_zoom() method
    _register_keyboard_zoom: function(controls) {
        $(document).on('keydown',{controls: controls},controls._keyboard_zoom);
    },

    // [private] _unregister_keyboard_zoom() method
    _unregister_keyboard_zoom: function(controls) {
        $(document).off('keydown',controls._keyboard_zoom);
    },

    // [private] _keyboard_move() method
    _keyboard_move: function(e) {

        var controls = e.data.controls;
        if (!controls.keyboard.move.active)
            return;

        var needDrawScene = true;
        var moveStep = controls.keyboard.move.step;

        // move
        switch(e.keyCode) {
            case 37:            // arrow left
                controls.panorama.lon -= moveStep;
                break;
            case 38:            // arrow top
                controls.panorama.lat -= moveStep;
                break;
            case 39:            // arrow right
                controls.panorama.lon += moveStep;
                break;
            case 40:            // arrow bottom
                controls.panorama.lat += moveStep;
                break;
            default:
                needDrawScene = false;
        }

        // update
        if (needDrawScene)
            controls.panorama.drawScene();

    },

    // [private] _keyboard_zoom() method
    _keyboard_zoom: function(e) {

        var controls = e.data.controls;
        if (!controls.keyboard.zoom.active)
            return;

        var needZoomUpdate = true;

        // zoom
        switch(e.keyCode) {
            case 107:           // [-] key
                controls.panorama.camera.zoom.current -= controls.keyboard.zoom.step;
                break;
            case 109:           // [+] key
                controls.panorama.camera.zoom.current += controls.keyboard.zoom.step;
                break;
            default:
                needZoomUpdate = false;
        }

        // update
        if (needZoomUpdate)
            controls.panorama.zoomUpdate();

    },

    // [private] _init_devicemotion() method
    _init_devicemotion: function() {

        var controls = this;

        // devicemotion move
        if (controls.devicemotion.move.active)
            controls._register_devicemotion_move(controls);

        // watch devicemotion move properties
        watch(controls.devicemotion.move,['active'], function() {
            if (controls.devicemotion.move.active)
                controls._register_devicemotion_move(controls);
            else
                controls._unregister_devicemotion_move(controls);
        });

    },

    // [private] _register_devicemotion_move() method
    _register_devicemotion_move: function(controls) {

        // pass controls
        window._controls_devicemotion = controls;

        // html5 device motion
        if (window.DeviceMotionEvent) {

            // turn touch move off to avoid interferences
            controls.touch.move.active = false;

            // register event
            window.addEventListener('devicemotion',controls._device_move_by_device_motion,false);

        }

    },

    // [private] _unregister_devicemotion_move() method
    _unregister_devicemotion_move: function(controls) {

        // motion
        if (window.DeviceMotionEvent)
            window.removeEventListener('devicemotion',controls._device_move_by_device_motion,false);

        // reset internals
        controls.devicemotion.internal.ticks.time = 0;
        controls.devicemotion.internal.gravity.aligned = false;

        // clear controls
        window._controls_devicemotion = null;

    },

    // [private] _device_move_by_device_motion() method
    _device_move_by_device_motion: function(e) {

        var controls = window._controls_devicemotion;
        if (!controls.devicemotion.move.active)
            return;

        // check for gravity alignment
        if (!controls.devicemotion.internal.gravity.aligned) {
            controls.gravity_alignment(e.accelerationIncludingGravity);
            return;
        }

        // first tick after gravity is aligned
        if (controls.devicemotion.internal.ticks.time == 0) {
            controls.devicemotion.internal.ticks.time = (new Date()).getTime();
            return;
        }

        // time
        var now = (new Date()).getTime();
        var elapsed = (now - controls.devicemotion.internal.ticks.time) / 1000;

        // elapsed time is beyond threshold
        if (elapsed > controls.devicemotion.internal.ticks.threshold) {
            controls.devicemotion.internal.gravity.aligned = false;
            return;
        }

        // original orientation
        var lon = controls.devicemotion.internal.orientation.lon;
        var lat = controls.devicemotion.internal.orientation.lat;

        // panorama orientation per device orientation
        if (controls.orientation.portrait) {
            lon -= controls.devicemotion.internal.gravity.sign * e.rotationRate.beta * elapsed;
            lat -= controls.devicemotion.internal.gravity.sign * e.rotationRate.alpha * elapsed;
        } else {
            lon += controls.devicemotion.internal.gravity.sign * e.rotationRate.alpha * elapsed;
            lat -= controls.devicemotion.internal.gravity.sign * e.rotationRate.beta * elapsed;
        }

        // assign orientation
        controls.panorama.lon = lon;
        controls.panorama.lat = lat;
        controls.devicemotion.internal.orientation.lon = lon;
        controls.devicemotion.internal.orientation.lat = lat;

        // store time
        controls.devicemotion.internal.ticks.time = now;

        // limit ticks rate
        controls.devicemotion.internal.ticks.count++;
        if (controls.devicemotion.internal.ticks.count <= controls.devicemotion.internal.ticks.nth)
            return;
        else
            controls.devicemotion.internal.ticks.count = 0;

        // moved beyond rotation threshold
        var needDrawScene = (e.rotationRate.alpha > controls.devicemotion.internal.orientation.threshold
                          || e.rotationRate.beta > controls.devicemotion.internal.orientation.threshold);

        // draw scene
        if (needDrawScene)
            controls.panorama.drawScene();

    }

});

/**
 * Extends Panorama prototype
 */
$.extend(Panorama.prototype, {

    // init() method
    init: function panorama_init() {

        var panorama = this;

        // controls defined in freepano options
        if (typeof panorama.controls !== 'undefined') {
            if (!(panorama.controls instanceof Controls)) {
                // convert options to instanciated class
                panorama.controls = new Controls($.extend(true,{
                    panorama: panorama,
                    callback: function() {
                        Controls.prototype.panorama_init.call(panorama);
                    }
                },panorama.controls));
            }
        } else {
            Controls.prototype.panorama_init.call(panorama);
        }

    }

});
