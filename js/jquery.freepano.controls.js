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

// closure
(function($,Panorama) {

/*
 * Controls
 * Class Constructor
 */
function Controls(options) {

    if (!(this instanceof Controls))
        return new Controls(options);

    $.extend(true,this,this.defaults,options);
    this.init();

} // Controls Constructor


/*
 * Controls
 * Class Prototype
 */
$.extend(true,Controls.prototype, {

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
                active: false,
                remote: false
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

    }, // defaults

    /**
     * init()
     * Initializes Controls properties and Device Motion.
     *
     * @return  void
     */
    init: function controls_init() {

        var controls = this;

        // orientation
        this.updateDeviceOrientation();

        // window resize event
        $(window).on('resize.controls', function(e) {

            // keep orientation
            var pos = controls.orientation.portrait;

            // detect orientation
            controls.updateDeviceOrientation();

            // orientation has changed, ask for recalibration
            if (controls.orientation.portrait != pos) {
                controls.devicemotion.internal.calibration.done = false;
                controls.devicemotion.internal.calibration.step = null;
            }

        });

        // devicemotion
        this.deviceMotionInit();

    }, // controls_init

    /**
     * on_panorama_init()
     * Event triggered on panorama init. Instanciates the Control class.
     *
     * @return  void
     */
    on_panorama_init: function controls_on_panorama_init() {

        // controls is not defined in freepano options
        if (typeof this.controls === 'undefined')
            return;

        // class instantiation and extension
        if (!(this.controls instanceof Controls))
            this.controls = new Controls($.extend(true,{panorama:this},this.controls)); // options

    }, // controls_on_panorama_init

    /**
     * on_panorama_ready()
     * Event triggered on panorama init. Initializes touch and keyboard controls.
     *
     * @return  void
     */
    on_panorama_ready: function controls_on_panorama_ready(panorama_event) {

        // touch
        this.controls.touchInit();

        // keyboard
        this.controls.keyboardInit();

        // devicemotion switch
        this.controls.deviceMotionInitSwitch();

    }, // controls_on_panorama_ready

    /**
     * updateDeviceOrientation()
     * Updates device orientation (portrait or landscape) flags.
     *
     * @return  void
     */
    updateDeviceOrientation: function controls_updateDeviceOrientation() {
        this.orientation.portrait = ($(window).width() < $(window).height());
        this.orientation.landscape = !this.orientation.portrait;
    }, // controls_updateDeviceOrientation

    /**
     * touchInit()
     * Initializes touch events. Uses watch.js to register/unregister events
     * dynamically based on their active flags.
     *
     * @return  void
     */
    touchInit: function controls_touchInit() {

        var controls = this;

        // touch move
        if (controls.touch.move.active)
            controls.touchMoveRegister(controls);

        // touch zoom
        if (controls.touch.zoom.active)
            controls.touchZoomRegister(controls);

        // watch touch move properties
        watch(controls.touch.move,['active'], function() {
            if (controls.touch.move.active)
                controls.touchMoveRegister(controls);
            else
                controls.touchMoveUnregister(controls);
        });

        // watch touch zoom properties
        watch(controls.touch.zoom,['active'], function() {
            if (controls.touch.zoom.active)
                controls.touchZoomRegister(controls);
            else
                controls.touchZoomUnregister(controls);
        });

        // zoom step
        if (controls.touch.zoom.step == null)
            controls.touch.zoom.step = controls.panorama.camera.zoom.step;

    }, // controls_touchInit

    /**
     * touchInstance()
     * Instanciates Hammer.js on the renderer container.
     *
     * @return  void
     */
    touchInstance: function controls_touchInstance(controls) {

        // keep a reference to controls
        window._controls_touch = controls;

        // instantiate hammer.js
        if (controls.touch.internal.hammer == null) {
            var hammer = controls.touch.internal.hammer = new Hammer($('canvas:first',controls.panorama.container).get(0));

            //// fix: hammer event handlers registered multiple times (on panorama change)
            hammer._on = hammer.on;

            hammer.on = function(events, handler) {

              var hammer = this;

              try { hammer.off(events,handler); } catch(e) {}
              hammer._on(events,handler);

              return this;

            }
            ////

        }

    }, // controls_touchInstance

    /**
     * touchMoveRegister()
     * Registers touch moves through Hammer.js pan start/move.
     *
     * @return  void
     */
    touchMoveRegister: function controls_touchMoveRegister(controls) {

        // instance
        controls.touchInstance(controls);

        // activate event
        controls.touch.internal.hammer.get('pan').set({enable:true,direction:Hammer.DIRECTION_ALL});

        // register events
        controls.touch.internal.hammer.on('panstart',controls.onTouchPanStart);
        controls.touch.internal.hammer.on('panmove',controls.onTouchPanMove);

    }, // controls_touchMoveRegister

    /**
     * touchMoveUnregister()
     * Unregisters touch moves through Hammer.js pan start/move.
     *
     * @return  void
     */
    touchMoveUnregister: function controls_touchMoveUnregister(controls) {

        // unregister events
        controls.touch.internal.hammer.off('panmove',controls.onTouchPanMove);
        controls.touch.internal.hammer.off('panstart',controls.onTouchPanStart);

        // desactivate event
        controls.touch.internal.hammer.get('pan').set({enable:false});

    }, // controls_touchMoveUnregister

    /**
     * onTouchPanStart()
     * Event triggered on touch pan start. Simulates a Panorama mouse down event.
     *
     * @return  void
     */
    onTouchPanStart: function controls_onTouchPanStart(e) {
        if (window._controls_touch.touchPanMouseImpersonate(e) != null)
            window._controls_touch.panorama.onmousedown(e);
    }, // controls_onTouchPanStart

    /**
     * onTouchPanMove()
     * Event triggered on touch pan move. Simulates a Panorama mouse move event.
     *
     * @return  void
     */
    onTouchPanMove: function controls_onTouchPanMove(e) {
        if (window._controls_touch.touchPanMouseImpersonate(e) != null)
            window._controls_touch.panorama.onmousemove(e);
    }, // controls_onTouchPanMove

    /**
     * touchPanMouseImpersonate()
     * Prepare a touch event for Panorama events by adding mouse impersonation.
     *
     * @return  Event       Hammer pan event or null if touch is not active.
     */
    touchPanMouseImpersonate: function controls_touchPanMouseImpersonate(e) {

        if (!window._controls_touch.touch.move.active)
            return null;

        // impersonate mouse properties
        e.clientX = e.center.x;
        e.clientY = e.center.y;
        e.buttons = 1;

        return e;

    }, // controls_touchPanMouseImpersonate

    /**
     * touchZoomRegister()
     * Registers touch zoom through Hammer.js pinch in/out.
     *
     * @return  void
     */
    touchZoomRegister: function controls_touchZoomRegister(controls) {

        // instance
        controls.touchInstance(controls);

        // activate event
        controls.touch.internal.hammer.get('pinch').set({enable:true});

        // register events
        controls.touch.internal.hammer.on('pinchin',controls.onTouchZoomIn);
        controls.touch.internal.hammer.on('pinchout',controls.onTouchZoomOut);

    }, // controls_touchZoomRegister

    /**
     * touchZoomUnregister()
     * Unregisters touch zoom through Hammer.js pinch in/out.
     *
     * @return  void
     */
    touchZoomUnregister: function controls_touchZoomUnregister(controls) {

        // unregister events
        controls.touch.internal.hammer.off('pinchin',controls.onTouchZoomIn);
        controls.touch.internal.hammer.off('pinchout',controls.onTouchZoomOut);

        // desactivate event
        controls.touch.internal.hammer.get('pinch').set({enable:false});

    }, // controls_touchZoomUnregister

    /**
     * touchZoomPanorama()
     * Calls zoom update on the Panorama.
     *
     * @return  void
     */
    touchZoomPanorama: function controls_touchZoomPanorama(sign) {

        if (!window._controls_touch.touch.move.active)
            return;

        // zoom
        window._controls_touch.panorama.camera.zoom.current += sign * (window._controls_touch.touch.zoom.step / 10);
        window._controls_touch.panorama.zoomUpdate();

    }, // controls_touchZoomPanorama

    /**
     * onTouchZoomIn()
     * Event triggered on touch zoom in. Calls a Panorama zoom in.
     *
     * @return  void
     */
    onTouchZoomIn: function controls_onTouchZoomIn(e) {
        window._controls_touch.touchZoomPanorama(1);
    }, // controls_onTouchZoomIn

    /**
     * onTouchZoomOut()
     * Event triggered on touch zoom in. Calls a Panorama zoom in.
     *
     * @return  void
     */
    onTouchZoomOut: function controls_onTouchZoomOut(e) {
        window._controls_touch.touchZoomPanorama(-1);
    }, // controls_onTouchZoomOut

    /**
     * keyboardInit()
     * Initializes keyboard events. Uses watch.js to register/unregister events
     * dynamically based on their active flags.
     *
     * @return  void
     */
    keyboardInit: function controls_keyboardInit() {

        var controls = this;

        // keyboard move
        if (controls.keyboard.move.active)
            controls.keyboardMoveRegister(controls);

        // keyboard zoom
        if (controls.keyboard.zoom.active)
            controls.keyboardZoomRegister(controls);

        // watch keyboard move properties
        watch(controls.keyboard.move,['active'], function() {
            if (controls.keyboard.move.active)
                controls.keyboardMoveRegister(controls);
            else
                controls.keyboardMoveUnregister(controls);
        });

        // watch keyboard zoom properties
        watch(controls.keyboard.zoom,['active'], function() {
            if (controls.keyboard.zoom.active)
                controls.keyboardZoomRegister(controls);
            else
                controls.keyboardZoomUnregister(controls);
        });

        // zoom step
        if (controls.keyboard.zoom.step == null)
            controls.keyboard.zoom.step = controls.panorama.camera.zoom.step;

    }, // controls_keyboardInit

    /**
     * keyboardMoveRegister()
     * Registers keyboard move events.
     *
     * @return  void
     */
    keyboardMoveRegister: function controls_keyboardMoveRegister(controls) {
        $(document).on('keydown.controls',{controls: controls},controls.onKeyboardDownMove);
    }, // controls_keyboardMoveRegister

    /**
     * keyboardMoveUnregister()
     * Unregisters keyboard move events.
     *
     * @return  void
     */
    keyboardMoveUnregister: function controls_keyboardMoveUnregister(controls) {
        $(document).off('keydown.controls',controls.onKeyboardDownMove);
    }, // controls_keyboardMoveUnregister

    /**
     * onKeyboardDownMove()
     * Event triggered on keyboard keydown for a move. Calls a Panorama rotation.
     *
     * @return  void
     */
    onKeyboardDownMove: function controls_onKeyboardDownMove(e) {

        var controls = e.data.controls;
        if (!controls.keyboard.move.active)
            return;

        var redraw = true;
        var moveStep = controls.keyboard.move.step;

        // move
        switch(e.keyCode) {
            case 37:            // arrow left
                controls.panorama.lon -= moveStep;
                break;
            case 38:            // arrow top
                controls.panorama.lat += moveStep;
                break;
            case 39:            // arrow right
                controls.panorama.lon += moveStep;
                break;
            case 40:            // arrow bottom
                controls.panorama.lat -= moveStep;
                break;
            default:
                redraw = false;
        }

        // update
        if (redraw) {
            controls.panorama.dispatch('rotate');
            controls.panorama.drawScene(function() {
                $('canvas:first',controls.panorama.container).trigger('mousemove');
            });
        }

    }, // controls_onKeyboardDownMove

    /**
     * keyboardZoomRegister()
     * Registers keyboard zoom events.
     *
     * @return  void
     */
    keyboardZoomRegister: function controls_keyboardZoomRegister(controls) {
        $(document).on('keydown.controls',{controls: controls},controls.onKeyboardDownZoom);
    }, // controls_keyboardZoomRegister

    /**
     * keyboardZoomUnregister()
     * Unregisters keyboard zoom events.
     *
     * @return  void
     */
    keyboardZoomUnregister: function controls_keyboardZoomUnregister(controls) {
        $(document).off('keydown.controls',controls.onKeyboardDownZoom);
    }, // controls_keyboardZoomUnregister

    /**
     * onKeyboardDownZoom()
     * Event triggered on keyboard keydown for a zoom. Calls a Panorama zoom.
     *
     * @return  void
     */
    onKeyboardDownZoom: function controls_onKeyboardDownZoom(e) {

        var controls = e.data.controls;
        if (!controls.keyboard.zoom.active)
            return;

        var redraw = true;

        // zoom
        switch(e.keyCode) {
            case 107:           // [-] key
                controls.panorama.camera.zoom.current -= controls.keyboard.zoom.step;
                break;
            case 109:           // [+] key
                controls.panorama.camera.zoom.current += controls.keyboard.zoom.step;
                break;
            default:
                redraw = false;
        }

        // update
        if (redraw)
            controls.panorama.zoomUpdate();

    }, // controls_onKeyboardDownZoom

    /**
     * deviceMotionInit()
     * Initializes device motion events. Uses watch.js to register/unregister
     * events dynamically based on their active flags.
     *
     * @return  void
     */
    deviceMotionInit: function controls_deviceMotionInit() {

        var controls = this;

        // watch devicemotion move properties
        watch(controls.devicemotion.move,['active'], function() {
            if (controls.devicemotion.move.active)
                controls.deviceMotionMoveRegister(controls);
            else
                controls.deviceMotionMoveUnregister(controls);
        });

        // devicemotion move
        if (controls.devicemotion.move.active)
            controls.deviceMotionMoveRegister(controls);

    }, // controls_deviceMotionInit

    /**
     * deviceMotionInit()
     * Initializes device motion GUI switch.
     *
     * @return  void
     */
    deviceMotionInitSwitch: function controls_deviceMotionInitSwitch() {

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

    }, // controls_deviceMotionInitSwitch

    /**
     * deviceMotionMoveRegister()
     * Registers move events (on HTML5 DeviceMotion compatible devices only).
     *
     * @return  void
     */
    deviceMotionMoveRegister: function controls_deviceMotionMoveRegister(controls) {

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
            window.addEventListener('devicemotion',controls.onDeviceMotionMove,false);

        // not supported
        } else {
            controls.devicemotion.move.active = false; // unregister
        }

    }, // controls_deviceMotionMoveRegister

    /**
     * deviceMotionMoveUnregister()
     * Unregisters device motion move events.
     *
     * @return  void
     */
    deviceMotionMoveUnregister: function controls_deviceMotionMoveUnregister(controls) {

        // motion
        if (window.DeviceMotionEvent) {

            // unregister event
            window.removeEventListener('devicemotion',controls.onDeviceMotionMove,false);

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

    }, // controls_deviceMotionMoveUnregister

    /**
     * onDeviceMotionMove()
     * Event triggered on devicemotion move. Calls a Panorama rotation.
     *
     * @return  void
     */
    onDeviceMotionMove: function controls_onDeviceMotionMove(e) {

        var controls = window._controls_devicemotion;
        if (!controls.devicemotion.move.active && !controls.devicemotion.move.remote)
            return;

        // check if calibration has been made
        if (!controls.devicemotion.internal.calibration.done) {
            controls.deviceMotionWizard(e);
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
            controls.resetTicks();
            return;
        }

        // keep time
        controls.devicemotion.internal.ticks.time = now;

        // original orientation
        var lon = controls.devicemotion.internal.orientation.lon;
        var lat = controls.devicemotion.internal.orientation.lat;

        // panorama orientation per device orientation
        lon -= controls.devicemotion.internal.calibration.rotation.sign * e.rotationRate[controls.devicemotion.internal.calibration.rotation.axis] * elapsed;
        lat -= controls.devicemotion.internal.calibration.tilt.sign * e.rotationRate[controls.devicemotion.internal.calibration.tilt.axis] * elapsed;

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
         || e.rotationRate[controls.devicemotion.internal.calibration.rotation.axis] > controls.devicemotion.internal.orientation.threshold) {
            controls.panorama.dispatch('rotate');
            controls.panorama.drawScene();
        }

    }, // controls_onDeviceMotionMove

    /**
     * deviceMotionWizard()
     * Handles calibration wizard steps if the device is not fully calibrated.
     *
     * @return  void
     */
    deviceMotionWizard: function controls_deviceMotionWizard(e) {

        // step
        if (this.devicemotion.internal.calibration.step == null)
            this.deviceMotionWizardScreenInit(e);
        else if (this.devicemotion.internal.calibration.step == 'compatibility')
            this.deviceMotionWizardTestCompatibility(e);
        else if (this.devicemotion.internal.calibration.step == 'rotation.run')
            this.deviceMotionWizardCalibrateRotation(e);
        else if (this.devicemotion.internal.calibration.step == 'tilt.run')
            this.deviceMotionWizardCalibrateTilting(e);
        else if (this.devicemotion.internal.calibration.step == 'gravity.run')
            this.deviceMotionWizardCalibrateGravity(e);

    }, // controls_deviceMotionWizard

    /**
     * deviceMotionWizardScreenInit()
     * Displays the device calibration wizard screen to the enduser.
     *
     * @return  void
     */
    deviceMotionWizardScreenInit: function controls_deviceMotionWizardScreenInit(e) {

        var controls = this;

        // step
        this.devicemotion.internal.calibration.step = 'init';

        // remove previous calibration screen if already opened
        controls.deviceMotionWizardScreenTerminate();

        // define calibration screen
        var calibration = $('<div>',{'id':'calibration'});
        calibration.width($(window).width());
        calibration.height($(window).height());

        // window resize event
        $(window).on('resize.devicemotionwizard',controls.deviceMotionWizardScreenResize);

        // define wizard
        var wizard = $('<div>',{'class':'wizard','style':'visibility:hidden;'});
        var content = $('<div>',{'style':'display:inline-block;width:auto;'});

        // define image
        content.append(
            $('<div>',{'class':'image'}).append(
                $('<img>',{'src':'img/calibration-init.gif','width':150})
        ));

        // define display
        content.append(
            $('<div>',{'class':'step'}).append(
                $('<div>',{'class':'title'}).append('Calibration Wizard')
            ).append(
                $('<div>',{'class':'desc'}).append('The next steps will calibrate your device to use gyroscopic motion. Please have the device vertically in front of you.')
        ));

        // clear
        content.append($('<div>',{'style':'clear:both;'}));

        // action
        var action = $('<a>',{'class':'action'})
            .append('Next step')
            .on('click.controls',function(event) {
                action.remove();
                $('#calibration .step .title').html('Please wait...');
                $('#calibration .step .desc').slideUp(400, function() {
                    controls.resetTicks();
                    controls.devicemotion.internal.calibration.step = 'compatibility';
                });
        });

        // dom
        $('body').append(calibration.append(wizard.append(content)));
        $('#calibration .step').append(action);

        // positionate wizard
        controls.deviceMotionWizardScreenResize();

        // display
        wizard.css('visibility','visible');

    }, // controls_deviceMotionWizardScreenInit

    /**
     * deviceMotionWizardTestCompatibility()
     * Tests the device compatibility before allowing the user to proceed.
     *
     * @return  void
     */
    deviceMotionWizardTestCompatibility: function controls_deviceMotionWizardTestCompatibility(e) {

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
            this.resetTicks();
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
            this.deviceMotionWizardScreenRotation();
        else
            this.deviceMotionWizardScreenIncompatibleDevice();

    }, // controls_deviceMotionWizardTestCompatibility

    /**
     * deviceMotionWizardScreenIncompatibleDevice()
     * Displays the device incompatibility screen to the enduser.
     *
     * @return  void
     */
    deviceMotionWizardScreenIncompatibleDevice: function controls_deviceMotionWizardScreenIncompatibleDevice() {

        var controls = this;

        // step
        this.devicemotion.internal.calibration.step = 'compatibility.none';

        // image
        $('#calibration .image img').attr('src','img/calibration-incompatible.gif');

        // display
        $('#calibration .step .title').html('Device motion not available');
        $('#calibration .step .desc').html('Unable to track motion on this device and browser combination.');

        // action
        var action = $('<a>',{'class':'action',})
            .append('Exit')
            .on('click.controls',function(event) {

                // unregister
                controls.devicemotion.move.active = false;
                controls.devicemotion.move.remote = false;

                // display
                action.remove();
                $('#calibration .step .desc').slideUp(400, function() {
                    controls.deviceMotionWizardScreenTerminate();
                    controls.devicemotion.internal.calibration.step = null;
                });

        });

        // dom
        $('#calibration .step').append(action);
        $('#calibration .step .desc').slideDown(400);

    }, // controls_deviceMotionWizardScreenIncompatibleDevice

    /**
     * deviceMotionWizardScreenRotation()
     * Displays the device rotation calibration screen to the enduser.
     *
     * @return  void
     */
    deviceMotionWizardScreenRotation: function controls_deviceMotionWizardScreenRotation() {

        var controls = this;

        // step
        this.devicemotion.internal.calibration.step = 'rotation';

        // image
        $('#calibration .image img').attr('src','img/calibration-rotation.gif');

        // display
        $('#calibration .step .title').html('Rotation Angle');
        $('#calibration .step .desc').html('Press the button then <strong>rotate your device to the right</strong> as shown in the picture.');

        // action
        var action = $('<a>',{'class':'action'})
            .append('Next step')
            .on('click.controls',function(event) {
                action.remove();
                $('#calibration .step .title').html('Rotate to the right...');
                $('#calibration .step .desc').slideUp(400, function() {
                    controls.resetTicks();
                    controls.resetMotionAxis('rotation');
                    controls.devicemotion.internal.calibration.step = 'rotation.run';
                });
        });

        // dom
        $('#calibration .step').append(action);
        $('#calibration .step .desc').slideDown(400);

    }, // controls_deviceMotionWizardScreenRotation

    /**
     * deviceMotionWizardCalibrateRotation()
     * Detects the device rotation axis by accumulation until a limit is reached.
     *
     * @return  void
     */
    deviceMotionWizardCalibrateRotation: function controls_deviceMotionWizardCalibrateRotation(e) {

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
            this.resetTicks();
            this.resetMotionAxis('rotation');
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
            controls.deviceMotionWizardScreenTilting();

        });

    }, // controls_deviceMotionWizardCalibrateRotation

    /**
     * deviceMotionWizardScreenTilting()
     * Displays the device tilting calibration screen to the enduser.
     *
     * @return  void
     */
    deviceMotionWizardScreenTilting: function controls_deviceMotionWizardScreenTilting() {

        var controls = this;

        // step
        this.devicemotion.internal.calibration.step = 'tilt';

        // image
        $('#calibration .image img').attr('src','img/calibration-tilt.gif');

        // display
        $('#calibration .step .title').html('Tilting Angle');
        $('#calibration .step .desc').html('Press the button then <strong>tilt the device to the ground</strong> as shown in the picture.');

        // action
        var action = $('<a>',{'class':'action'})
            .append('Next step')
            .on('click.controls',function(event) {
                action.remove();
                $('#calibration .step .title').html('Tilt to the ground...');
                $('#calibration .step .desc').slideUp(400, function() {
                    controls.resetTicks();
                    controls.resetMotionAxis('tilt');
                    controls.devicemotion.internal.calibration.step = 'tilt.run';
                });
        });

        // dom
        $('#calibration .step').append(action);
        $('#calibration .step .desc').slideDown(400);

    }, // controls_deviceMotionWizardScreenTilting

    /**
     * deviceMotionWizardCalibrateTilting()
     * Detects the device tilting axis by accumulation until a limit is reached.
     *
     * @return  void
     */
    deviceMotionWizardCalibrateTilting: function controls_deviceMotionWizardCalibrateTilting(e) {

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
            this.resetTicks();
            this.resetMotionAxis('tilt');
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
            controls.deviceMotionWizardScreenGravity();

        });

    }, // controls_deviceMotionWizardCalibrateTilting

    /**
     * deviceMotionWizardScreenGravity()
     * Displays the device gravity calibration screen to the enduser.
     *
     * @return  void
     */
    deviceMotionWizardScreenGravity: function controls_deviceMotionWizardScreenGravity() {

        var controls = this;

        // step
        this.devicemotion.internal.calibration.step = 'gravity';

        // image
        $('#calibration .image img').attr('src','img/calibration-gravity.gif');

        // display
        $('#calibration .step .title').html('Gravity Alignment');
        $('#calibration .step .desc').html('Press the button then <strong>stand still</strong> while having the device vertically in front of you to align the device gravity.');

        // action
        var action = $('<a>',{'class':'action'})
            .append('Next step')
            .on('click.controls',function(event) {
                action.remove();
                $('#calibration .step .title').html('Stand still...');
                $('#calibration .step .desc').slideUp(400, function() {
                    controls.resetTicks();
                    controls.resetAcceleration();
                    controls.devicemotion.internal.calibration.step = 'gravity.run';
                });
        });

        // dom
        $('#calibration .step').append(action);
        $('#calibration .step .desc').slideDown(400);

    }, // controls_deviceMotionWizardScreenGravity

    /**
     * deviceMotionWizardCalibrateGravity()
     * Detects the device gravity by accumulation until an events limit is reached.
     *
     * @return  void
     */
    deviceMotionWizardCalibrateGravity: function controls_deviceMotionWizardCalibrateGravity(e) {

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
            this.resetTicks();
            this.resetAcceleration();
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
        this.deviceMotionWizardScreenDone();

    }, // controls_deviceMotionWizardCalibrateGravity

    /**
     * deviceMotionWizardScreenDone()
     * Displays the device calibration wizard final screen to the enduser.
     *
     * @return  void
     */
    deviceMotionWizardScreenDone: function controls_deviceMotionWizardScreenDone() {

        var controls = this;

        // step
        this.devicemotion.internal.calibration.step = 'done';

        // activate
        this.resetTicks();
        this.devicemotion.internal.calibration.done = true;
        this.devicemotion.internal.calibration.step = null;

        // image
        $('#calibration .image img').attr('src','img/calibration-done.gif');

        // display
        $('#calibration .step .title').html('Calibration Done');
        $('#calibration .step .desc').html('Congratulations, your device is now <strong>calibrated</strong>.');

        // action
        var action = $('<a>',{'class':'action'})
            .append('Exit')
            .on('click.controls',function(event) {
                action.remove();
                $('#calibration .step').slideUp(400, function() {
                    controls.deviceMotionWizardScreenTerminate();
                });
        });

        // dom
        $('#calibration .step').append(action);
        $('#calibration .step .desc').slideDown(400);

    }, // controls_deviceMotionWizardScreenDone

    /**
     * deviceMotionWizardScreenResize()
     * Resizes the wizard screen on a window event.
     *
     * @return  void
     */
    deviceMotionWizardScreenResize: function controls_deviceMotionWizardScreenResize(e) {

        $('#calibration').width($(window).width());
        $('#calibration').height($(window).height());

        $('#calibration .wizard').css('margin-top',($(window).height()-$('#calibration .wizard').height())/2);
        $('#calibration .step').width($('#calibration .step').width());

    }, // controls_deviceMotionWizardScreenResize

    /**
     * deviceMotionWizardScreenTerminate()
     * Closes the wizard screen and free events attached.
     *
     * @return  void
     */
    deviceMotionWizardScreenTerminate: function controls_deviceMotionWizardScreenTerminate() {

        // window resize event
        $(window).off('resize.devicemotionwizard',this.deviceMotionWizardScreenResize);

        // remove calibration screen
        if ($('#calibration').length > 0)
            $('#calibration').remove();

    }, // controls_deviceMotionWizardScreenTerminate

    /**
     * resetTicks()
     * Resets calibration ticks (internal values).
     *
     * @return  void
     */
    resetTicks: function controls_resetTicks() {
        this.devicemotion.internal.ticks.count = 0;
        this.devicemotion.internal.ticks.time = 0;
    }, // controls_resetTicks

    /**
     * resetMotionAxis()
     * Resets calibration motion axis (internal values).
     *
     * @return  void
     */
    resetMotionAxis: function controls_resetMotionAxis(axis) {
        this.devicemotion.internal.calibration[axis].axis = null;
        this.devicemotion.internal.calibration[axis].sign = null;
        this.devicemotion.internal.calibration.motion.alpha = 0;
        this.devicemotion.internal.calibration.motion.beta = 0;
        this.devicemotion.internal.calibration.motion.gamma = 0;
    }, // controls_resetMotionAxis

    /**
     * resetAcceleration()
     * Resets calibration acceleration (internal values).
     *
     * @return  void
     */
    resetAcceleration: function controls_resetAcceleration() {
        this.devicemotion.internal.calibration.acceleration.x = 0;
        this.devicemotion.internal.calibration.acceleration.y = 0;
        this.devicemotion.internal.calibration.acceleration.z = 0;
    } // controls_resetAcceleration

}); // Controls Prototype


/*
 * Controls
 * Event Dispatcher
 */
Panorama.prototype.dispatchEventsTo(Controls.prototype);


// closure
})(jQuery,Panorama);
