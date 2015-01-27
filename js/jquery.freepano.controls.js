/*
 * freepano - WebGL panorama viewer
 *
 * Copyright (c) 2014-2015 FOXEL SA - http://foxel.ch
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

        // orientation
        orientation: {
            portrait: false,
            landscape: true,
        },

        // touch
        touch: {
            move: {
                active: false
            },
            zoom: {
                active: false,
                step: null  // value, or [null] meaning the same as panorama.camera.zoom.step
            },
            internal: {
                hammer: null,
                movestate: false
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
                    nth: 3,             // every nth event ticks (redraw)
                    cth: 32,            // every nth event ticks (compatibility)
                    gth: 32,            // every nth event ticks (gravity)
                    threshold: 100,     // maximum elapsed time (ms.) between ticks
                    count: 0,           // [internal]
                    time: 0             // [internal]
                },
                orientation: {
                    threshold: 0.05,    // rotation rate noise
                    lon: 0,             // [internal]
                    lat: 0              // [internal]
                },
                calibration: {
                    done: false,        // [internal]
                    step: null,         // [internal]
                    acceleration: {
                        x: 0,           // [internal]
                        y: 0,           // [internal]
                        z: 0            // [internal]
                    },
                    motion: {
                        alpha: 0,       // [internal]
                        beta: 0,        // [internal]
                        gamma: 0        // [internal]
                    },
                    tilt: {
                        axis: null,     // [internal]
                        sign: null      // [internal]
                    },
                    rotation: {
                        axis: null,     // [internal]
                        sign: null      // [internal]
                    }
                }
            }
        }

    },

    // panorama_init() method
    panorama_init: Panorama.prototype.init,

    // init() method
    init: function() {

        var controls = this;

        // orientation
        this.orientation_detect();

        // window resize event
        $(window).on('resize.controls', function(e) {

            // keep orientation
            var pos = controls.orientation.portrait;

            // detect orientation
            controls.orientation_detect();

            // orientation has changed, ask for recalibration
            if (controls.orientation.portrait != pos) {
                controls.devicemotion.internal.calibration.done = false;
                controls.devicemotion.internal.calibration.step = null;
            }

        });

        // devicemotion
        this._init_devicemotion();

    },

    // on_panorama_init() method
    on_panorama_init: function controls_on_panorama_init() {

        // controls is not defined in freepano options
        if (typeof this.controls === 'undefined')
            return;

        // class instantiation and extension
        if (!(this.controls instanceof Controls))
            this.controls = new Controls($.extend(true,{panorama:this},this.controls)); // options

    },

    // on_panorama_ready() method
    on_panorama_ready: function controls_on_panorama_ready(panorama_event) {

        // touch
        this.controls._init_touch();

        // keyboard
        this.controls._init_keyboard();

        // devicemotion switch
        this.controls._init_devicemotion_switch();

    },

    // orientation_detect() method
    orientation_detect: function() {
        this.orientation.portrait = ($(window).width() < $(window).height());
        this.orientation.landscape = !this.orientation.portrait;
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
        window._controls_touch = controls;

        // instantiate hammer.js
        if (controls.touch.internal.hammer == null)
            controls.touch.internal.hammer = new Hammer($('canvas:first',controls.panorama.container).get(0));

    },

    // [private] _register_touch_move() method
    _register_touch_move: function(controls) {

        controls._register_touch(controls);

        // activate event
        controls.touch.internal.hammer.get('pan').set({enable:true,direction:Hammer.DIRECTION_ALL});

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

        // register events
        controls.touch.internal.hammer.on('pinchin',controls._touch_zoom_pinchin);
        controls.touch.internal.hammer.on('pinchout',controls._touch_zoom_pinchout);

    },

    // [private] _unregister_touch_zoom() method
    _unregister_touch_zoom: function(controls) {

        // unregister events
        controls.touch.internal.hammer.off('pinchin',controls._touch_zoom_pinchin);
        controls.touch.internal.hammer.off('pinchout',controls._touch_zoom_pinchout);

        // desactivate event
        controls.touch.internal.hammer.get('pinch').set({enable:false});

    },

    // [private] _touch_move_panstart() method
    _touch_move_panstart: function(e) {

        var controls = window._controls_touch;
        if (!controls.touch.move.active)
            return;

        if (controls.panorama.mode.rotate)
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

        var controls = window._controls_touch;
        if (!controls.touch.move.active)
            return;

        // impersonate mouse properties
        e.clientX = e.center.x;
        e.clientY = e.center.y;
        e.buttons = 1;

        // override panorama.mode.rotate
        var rotate=controls.panorama.mode.rotate;
        controls.panorama.mode.rotate=true;

        var ret=controls.panorama.onmousemove(e);

        // restore panorama.mode.rotate
        controls.panorama.mode.rotate=rotate;

        return ret;
    },

    // [private] _touch_zoom_pinch() method
    _touch_zoom_pinch: function(sign) {

        var controls = window._controls_touch;
        if (!controls.touch.zoom.active)
            return;

        // zoom
        controls.panorama.camera.zoom.current += sign * (controls.touch.zoom.step / 10);
        controls.panorama.zoomUpdate();

    },

    // [private] _touch_zoom_pinchin() method
    _touch_zoom_pinchin: function(e) {
        window._controls_touch._touch_zoom_pinch(1);
    },

    // [private] _touch_zoom_pinchout() method
    _touch_zoom_pinchout: function(e) {
        window._controls_touch._touch_zoom_pinch(-1);
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
        $(document).on('keydown.controls',{controls: controls},controls._keyboard_move);
    },

    // [private] _unregister_keyboard_move() method
    _unregister_keyboard_move: function(controls) {
        $(document).off('keydown.controls',controls._keyboard_move);
    },

    // [private] _register_keyboard_zoom() method
    _register_keyboard_zoom: function(controls) {
        $(document).on('keydown.controls',{controls: controls},controls._keyboard_zoom);
    },

    // [private] _unregister_keyboard_zoom() method
    _unregister_keyboard_zoom: function(controls) {
        $(document).off('keydown.controls',controls._keyboard_zoom);
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
            controls.panorama.drawScene(function(){
              $('canvas:first',controls.panorama.container).trigger('mousemove');
            });

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

        // watch devicemotion move properties
        watch(controls.devicemotion.move,['active'], function() {
            if (controls.devicemotion.move.active)
                controls._register_devicemotion_move(controls);
            else
                controls._unregister_devicemotion_move(controls);
        });

        // devicemotion move
        if (controls.devicemotion.move.active)
            controls._register_devicemotion_move(controls);

    },

    // [private] _init_devicemotion_switch() method
    _init_devicemotion_switch: function() {

        var controls = this;

        // html5 device motion not available or not a mobile
        if (!window.DeviceMotionEvent || !$.browser.mobile)
            return;

        // dom
        var container = $(controls.panorama.container);
        var gyro = $('<div>',{'class':'gyro'});
        var button = $('<div>',{'class':'button'});
        var img = $('<img>',{src:'img/gyro.png',width:45,height:45,alt:''});

        // button event
        button.on('click.controls',function(e) {
            e.preventDefault();
            controls.devicemotion.move.active = !controls.devicemotion.move.active;
        });

        // append switch
        container.append(gyro.append(button.append(img)));

    },

    // [private] _register_devicemotion_move() method
    _register_devicemotion_move: function(controls) {

        // pass controls
        window._controls_devicemotion = controls;

        // html5 device motion
        if (window.DeviceMotionEvent) {

            // turn touch move off to avoid interferences
            if (controls.touch.move.active) {
                controls.touch.internal.movestate = true; // keep initial state
                controls.touch.move.active = false; // unregister
            }

            // register event
            window.addEventListener('devicemotion',controls._device_move_by_device_motion,false);

        // not supported
        } else {
            controls.devicemotion.move.active = false; // unregister
        }

    },

    // [private] _unregister_devicemotion_move() method
    _unregister_devicemotion_move: function(controls) {

        // motion
        if (window.DeviceMotionEvent) {

            // unregister event
            window.removeEventListener('devicemotion',controls._device_move_by_device_motion,false);

            // turn touch move on again if it was initialy requested
            if (controls.touch.internal.movestate) {
                controls.touch.internal.movestate = false;
                controls.touch.move.active = true; // register
            }

        }

        // reset internals
        controls.devicemotion.internal.ticks.time = 0;
        controls.devicemotion.internal.calibration.done = false;
        controls.devicemotion.internal.calibration.step = null;

        // clear controls
        window._controls_devicemotion = null;

    },

    // [private] _device_calibration() method
    _device_calibration: function(e) {

        // step
        if (this.devicemotion.internal.calibration.step == null)
            this._device_calibration_init(e);
        else if (this.devicemotion.internal.calibration.step == 'compatibility')
            this._device_calibration_compatibility(e);
        else if (this.devicemotion.internal.calibration.step == 'rotation.run')
            this._device_calibration_rotation_run(e);
        else if (this.devicemotion.internal.calibration.step == 'tilt.run')
            this._device_calibration_tilt_run(e);
        else if (this.devicemotion.internal.calibration.step == 'gravity.run')
            this._device_calibration_gravity_run(e);

    },

    // [private] _device_calibration_init() method
    _device_calibration_init: function(e) {

        var controls = this;

        // step
        this.devicemotion.internal.calibration.step = 'init';

        // remove previous calibration screen if already opened
        if ($('#calibration').length > 0)
            $('#calibration').remove();

        // define calibration screen
        var calibration = $('<div>',{'id':'calibration'});
        calibration.width($(window).width());
        calibration.height($(window).height());

        // display
        calibration.append('Calibration is needed to use accelerometer and gyroscope feature.');

        // action
        var action = $('<a>',{'class':'action','href':'#'})
            .append('[[[ CALIBRATE ]]]')
            .on('click.controls',function(event) {
                event.preventDefault();
                action.remove();
                controls._device_calibration_reset_ticks();
                controls.devicemotion.internal.calibration.step = 'compatibility';
        });

        // display
        $('body').append(calibration.append(action));

    },

    // [private] _device_calibration_compatibility() method
    _device_calibration_compatibility: function(e) {

        var compatible = true;
        var now = (new Date()).getTime();

        // first tick, keep time
        if (this.devicemotion.internal.ticks.time == 0) {
            this.devicemotion.internal.ticks.time = now;
            return;
        }

        // elapsed time between two ticks
        var elapsed = (now - this.devicemotion.internal.ticks.time) / 1000;

        // elapsed time is beyond threshold
        if (elapsed > this.devicemotion.internal.ticks.threshold) {
            this._device_calibration_reset_ticks();
            return;
        }

        // keep time
        this.devicemotion.internal.ticks.time = now;

        // skip nth ticks as devicemotion may need a few ticks to initialize
        this.devicemotion.internal.ticks.count++;
        if (this.devicemotion.internal.ticks.count <= this.devicemotion.internal.ticks.cth)
            return;

        // step
        this.devicemotion.internal.calibration.step = 'compatibility.done';

        // incomplete or not well-formatted event data
        if (typeof e.accelerationIncludingGravity !== 'object' || typeof e.rotationRate !== 'object'
                || $.isEmptyObject(e.accelerationIncludingGravity) || $.isEmptyObject(e.rotationRate))
            compatible = false;
        else if (!$.isNumeric(e.accelerationIncludingGravity.x) || !$.isNumeric(e.accelerationIncludingGravity.y) || !$.isNumeric(e.accelerationIncludingGravity.z)
                || !$.isNumeric(e.rotationRate.alpha) || !$.isNumeric(e.rotationRate.beta) || !$.isNumeric(e.rotationRate.gamma))
            compatible = false;

        // compatibility
        if (compatible)
            this._device_calibration_rotation();
        else
            this._device_calibration_incompatibility();

    },

    // [private] _device_calibration_incompatibility() method
    _device_calibration_incompatibility: function() {

        var controls = this;
        var calibration = $('#calibration');

        // step
        this.devicemotion.internal.calibration.step = 'compatibility.none';

        // unregister
        this.devicemotion.move.active = false;

        // display
        calibration.empty();
        calibration.append('Unable to track motion on this device and browser.');

        // action
        var action = $('<a>',{'class':'action','href':'#'})
            .append('[[[ CLOSE ]]]')
            .on('click.controls',function(event) {
                event.preventDefault();
                action.remove();
                calibration.remove();
                controls.devicemotion.internal.calibration.step = null;
        });

        // display
        calibration.append(action);

    },

    // [private] _device_calibration_rotation() method
    _device_calibration_rotation: function() {

        var controls = this;
        var calibration = $('#calibration');

        // step
        this.devicemotion.internal.calibration.step = 'rotation';

        // display
        calibration.empty();
        calibration.append('Step 1/3<br />Rotate your device to the right (~25°) along the Z-axis to calibrate the rotation angle.<br /><br />Press the button when you are ready to rotate the device...');

        // action
        var action = $('<a>',{'class':'action','href':'#'})
            .append('[[[ Calibrate the rotation angle ]]]')
            .on('click.controls',function(event) {
                event.preventDefault();
                action.remove();
                controls._device_calibration_reset_ticks();
                controls._device_calibration_reset_axis('rotation');
                controls.devicemotion.internal.calibration.step = 'rotation.run';
        });

        // display
        calibration.append(action);

    },

    // [private] _device_calibration_rotation_run() method
    _device_calibration_rotation_run: function(e) {

        var controls = this;
        var determined = false;
        var now = (new Date()).getTime();

        // first tick, keep time
        if (this.devicemotion.internal.ticks.time == 0) {
            this.devicemotion.internal.ticks.time = now;
            return;
        }

        // elapsed time between two ticks
        var elapsed = (now - this.devicemotion.internal.ticks.time) / 1000;

        // elapsed time is beyond threshold
        if (elapsed > this.devicemotion.internal.ticks.threshold) {
            this._device_calibration_reset_ticks();
            this._device_calibration_reset_axis('rotation');
            return;
        }

        // keep time
        this.devicemotion.internal.ticks.time = now;

        // listen each axis
        $.each(['alpha','beta','gamma'],function(index,axe) {

            // another axis determined
            if (determined || controls.devicemotion.internal.calibration.rotation.axis != null)
                return;

            // accumulation
            controls.devicemotion.internal.calibration.motion[axe] += (e.rotationRate[axe] * elapsed);
            if (Math.abs(controls.devicemotion.internal.calibration.motion[axe]) < 25)
                return;

            // step
            controls.devicemotion.internal.calibration.step = 'rotation.run.done';

            // axis determined
            determined = true;
            controls.devicemotion.internal.calibration.rotation.axis = axe;
            controls.devicemotion.internal.calibration.rotation.sign = controls.devicemotion.internal.calibration.motion[axe] > 0 ? 1 : -1;

            // continue
            controls._device_calibration_tilt();

        });

    },

    // [private] _device_calibration_tilt() method
    _device_calibration_tilt: function() {

        var controls = this;
        var calibration = $('#calibration');

        // step
        this.devicemotion.internal.calibration.step = 'tilt';

        // display
        calibration.empty();
        calibration.append('Step 2/3<br />Tilt the top of your device to the ground (~25°) along the X-axis to calibrate the tilting angle.<br /><br />Press the button when you are ready to tilt the device...');

        // action
        var action = $('<a>',{'class':'action','href':'#'})
            .append('[[[ Calibrate the tilting angle ]]]')
            .on('click.controls',function(event) {
                event.preventDefault();
                action.remove();
                controls._device_calibration_reset_ticks();
                controls._device_calibration_reset_axis('tilt');
                controls.devicemotion.internal.calibration.step = 'tilt.run';
        });

        // display
        calibration.append(action);

    },

    // [private] _device_calibration_tilt_run() method
    _device_calibration_tilt_run: function(e) {

        var controls = this;
        var determined = false;
        var now = (new Date()).getTime();

        // first tick, keep time
        if (this.devicemotion.internal.ticks.time == 0) {
            this.devicemotion.internal.ticks.time = now;
            return;
        }

        // elapsed time between two ticks
        var elapsed = (now - this.devicemotion.internal.ticks.time) / 1000;

        // elapsed time is beyond threshold
        if (elapsed > this.devicemotion.internal.ticks.threshold) {
            this._device_calibration_reset_ticks();
            this._device_calibration_reset_axis('tilt');
            return;
        }

        // keep time
        this.devicemotion.internal.ticks.time = now;

        // remove know rotation axis to minimize interferences
        var axes = ['alpha','beta','gamma'];
        axes.splice(axes.indexOf(this.devicemotion.internal.calibration.rotation.axis),1);

        // listen each axis
        $.each(axes,function(index,axe) {

            // another axis determined
            if (determined || controls.devicemotion.internal.calibration.tilt.axis != null)
                return;

            // accumulation
            controls.devicemotion.internal.calibration.motion[axe] += (e.rotationRate[axe] * elapsed);
            if (Math.abs(controls.devicemotion.internal.calibration.motion[axe]) < 25)
                return;

            // step
            controls.devicemotion.internal.calibration.step = 'tilt.run.done';

            // axis determined
            determined = true;
            controls.devicemotion.internal.calibration.tilt.axis = axe;
            controls.devicemotion.internal.calibration.tilt.sign = controls.devicemotion.internal.calibration.motion[axe] > 0 ? 1 : -1;

            // continue
            controls._device_calibration_gravity();

        });

    },

    // [private] _device_calibration_gravity() method
    _device_calibration_gravity: function() {

        var controls = this;
        var calibration = $('#calibration');

        // step
        this.devicemotion.internal.calibration.step = 'gravity';

        // display
        calibration.empty();
        calibration.append('Step 3/3<br />Stand still to align the device gravity..<br /><br />Press the button when you are ready to stand the device still...');

        // action
        var action = $('<a>',{'class':'action','href':'#'})
            .append('[[[ Calibrate the gravity ]]]')
            .on('click.controls',function(event) {
                event.preventDefault();
                action.remove();
                controls._device_calibration_reset_ticks();
                controls._device_calibration_reset_acceleration();
                controls.devicemotion.internal.calibration.step = 'gravity.run';
        });

        // display
        calibration.append(action);

    },

    // [private] _device_calibration_gravity_run() method
    _device_calibration_gravity_run: function(e) {

        var compatible = true;
        var now = (new Date()).getTime();

        // first tick, keep time
        if (this.devicemotion.internal.ticks.time == 0) {
            this.devicemotion.internal.ticks.time = now;
            return;
        }

        // elapsed time between two ticks
        var elapsed = (now - this.devicemotion.internal.ticks.time) / 1000;

        // elapsed time is beyond threshold
        if (elapsed > this.devicemotion.internal.ticks.threshold) {
            this._device_calibration_reset_ticks();
            this._device_calibration_reset_acceleration();
            return;
        }

        // keep time
        this.devicemotion.internal.ticks.time = now;

        // accumulation
        this.devicemotion.internal.calibration.acceleration.x += e.accelerationIncludingGravity.x;
        this.devicemotion.internal.calibration.acceleration.y += e.accelerationIncludingGravity.y;
        this.devicemotion.internal.calibration.acceleration.z += e.accelerationIncludingGravity.z;

        // limit accumulation to nth ticks
        this.devicemotion.internal.ticks.count++;
        if (this.devicemotion.internal.ticks.count <= this.devicemotion.internal.ticks.gth)
            return;

        // step
        this.devicemotion.internal.calibration.step = 'gravity.run.done';

        // average acceleration
        this.devicemotion.internal.calibration.acceleration.x /= this.devicemotion.internal.ticks.gth;
        this.devicemotion.internal.calibration.acceleration.y /= this.devicemotion.internal.ticks.gth;
        this.devicemotion.internal.calibration.acceleration.z /= this.devicemotion.internal.ticks.gth;

        // norm
        var norm = Math.sqrt(this.devicemotion.internal.calibration.acceleration.x * this.devicemotion.internal.calibration.acceleration.x
                           + this.devicemotion.internal.calibration.acceleration.y * this.devicemotion.internal.calibration.acceleration.y
                           + this.devicemotion.internal.calibration.acceleration.z * this.devicemotion.internal.calibration.acceleration.z);

        // initial panorama orientation
        this.devicemotion.internal.orientation.lon = this.panorama.lon;
        this.devicemotion.internal.orientation.lat = Math.asin(this.devicemotion.internal.calibration.acceleration.z / norm) * (180 / Math.PI);

        // continue
        this._device_calibration_done();

    },

    // [private] _device_calibration_done() method
    _device_calibration_done: function() {

        var controls = this;
        var calibration = $('#calibration');

        // step
        this.devicemotion.internal.calibration.step = 'done';

        // activate
        this._device_calibration_reset_ticks();
        this.devicemotion.internal.calibration.done = true;
        this.devicemotion.internal.calibration.step = null;

        // display
        calibration.empty();
        calibration.append('Congratulation, your device is now fully calibrated!');

        // action
        var action = $('<a>',{'class':'action','href':'#'})
            .append('[[[ CLOSE ]]]')
            .on('click.controls',function(event) {
                event.preventDefault();
                action.remove();
                calibration.remove();
        });

        // display
        calibration.append(action);

    },

    // [private] _device_calibration_reset_ticks() method
    _device_calibration_reset_ticks: function() {
        this.devicemotion.internal.ticks.count = 0;
        this.devicemotion.internal.ticks.time = 0;
    },

    // [private] _device_calibration_reset_axis() method
    _device_calibration_reset_axis: function(axis) {
        this.devicemotion.internal.calibration[axis].axis = null;
        this.devicemotion.internal.calibration[axis].sign = null;
        this.devicemotion.internal.calibration.motion.alpha = 0;
        this.devicemotion.internal.calibration.motion.beta = 0;
        this.devicemotion.internal.calibration.motion.gamma = 0;
    },

    // [private] _device_calibration_reset_acceleration() method
    _device_calibration_reset_acceleration: function() {
        this.devicemotion.internal.calibration.acceleration.x = 0;
        this.devicemotion.internal.calibration.acceleration.y = 0;
        this.devicemotion.internal.calibration.acceleration.z = 0;
    },

    // [private] _device_move_by_device_motion() method
    _device_move_by_device_motion: function(e) {

        var controls = window._controls_devicemotion;
        if (!controls.devicemotion.move.active)
            return;

        // check if calibration has been made
        if (!controls.devicemotion.internal.calibration.done) {
            controls._device_calibration(e);
            return;
        }

        // time
        var now = (new Date()).getTime();

        // first tick, keep time
        if (controls.devicemotion.internal.ticks.time == 0) {
            controls.devicemotion.internal.ticks.time = now;
            return;
        }

        // elapsed time between two ticks
        var elapsed = (now - controls.devicemotion.internal.ticks.time) / 1000;

        // elapsed time is beyond threshold
        if (elapsed > controls.devicemotion.internal.ticks.threshold) {
            controls._device_calibration_reset_ticks();
            return;
        }

        // keep time
        controls.devicemotion.internal.ticks.time = now;

        // original orientation
        var lon = controls.devicemotion.internal.orientation.lon;
        var lat = controls.devicemotion.internal.orientation.lat;

        // panorama orientation per device orientation
        lon -= controls.devicemotion.internal.calibration.rotation.sign * e.rotationRate[controls.devicemotion.internal.calibration.rotation.axis] * elapsed;
        lat += controls.devicemotion.internal.calibration.tilt.sign * e.rotationRate[controls.devicemotion.internal.calibration.tilt.axis] * elapsed;

        // assign orientation
        controls.panorama.lon = lon;
        controls.panorama.lat = lat;
        controls.devicemotion.internal.orientation.lon = lon;
        controls.devicemotion.internal.orientation.lat = lat;

        // limit webgl redraw to nth ticks
        controls.devicemotion.internal.ticks.count++;
        if (controls.devicemotion.internal.ticks.count <= controls.devicemotion.internal.ticks.nth)
            return;
        else
            controls.devicemotion.internal.ticks.count = 0;

        // webgl redraw as moved beyond rotation threshold
        if (e.rotationRate[controls.devicemotion.internal.calibration.tilt.axis] > controls.devicemotion.internal.orientation.threshold
         || e.rotationRate[controls.devicemotion.internal.calibration.rotation.axis] > controls.devicemotion.internal.orientation.threshold)
            controls.panorama.drawScene();

    }

});

Panorama.prototype.setupCallback(Controls.prototype);
