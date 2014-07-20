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

        // keyboard
        keyboard: {
            move: {
                active: false,
                step: 0.5
            },
            zoom: {
                active: false,
                step: null  // value, or [null] same as panorama.camera.zoom.step
            }
        },

        // device motion
        devicemotion: {
            nth: 5,         // limit event action to nth ticks
            move: {
                active: false,
                noise: 5,
                sensivity: 10
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
        });

        // keyboard
        $(document).on('keydown', function(e) {
            controls.keyboard_press(e);
        });

        // devicemotion orientation API
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', function(e) { controls.device_orientation(e); }, false);
        }

        // devicemotion motion API
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', function(e) { controls.device_motion(e); }, false);
        }

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

    // keyboard_press() method
    keyboard_press: function(e) {

        if (!this.keyboard.move.active && !this.keyboard.zoom.active)
            return;

        var needDrawScene = this.keyboard.move.active;
        var needZoomUpdate = this.keyboard.zoom.active;

        var moveStep = this.keyboard.move.step;
        var zoomStep = this.keyboard.zoom.step == null ?
            this.panorama.camera.zoom.step : this.keyboard.zoom.step;

        // move
        switch(e.keyCode) {
            case 37:            // arrow left
                this.panorama.lon -= moveStep;
                break;
            case 38:            // arrow top
                this.panorama.lat += moveStep;
                break;
            case 39:            // arrow right
                this.panorama.lon += moveStep;
                break;
            case 40:            // arrow bottom
                this.panorama.lat -= moveStep;
                break;
            default:
                needDrawScene = false;
        }

        // zoom
        switch(e.keyCode) {
            case 107:           // [-] key
                this.panorama.camera.zoom.current -= zoomStep;
                break;
            case 109:           // [+] key
                this.panorama.camera.zoom.current += zoomStep;
                break;
            default:
                needZoomUpdate = false;
        }

        // update
        if (needDrawScene)
            this.panorama.drawScene();
        if (needZoomUpdate)
            this.panorama.zoomUpdate();
    },

    // device
    device: {
        ticks: 0
    },

    // device_orientation() method
    device_orientation: function(e) {

        if (!this.devicemotion.move.active || !this.orientation.portrait)
            return;

        // limit ticks rate
        this.device.ticks++;
        if (this.device.ticks <= this.devicemotion.nth)
            return;
        else
            this.device.ticks = 0;

        // target
        var lon = 360-e.alpha;
        var lat = -(90-e.beta);

        // update
        var needDrawScene = !(this.panorama.lon == lon && this.panorama.lat == lat);

        // move
        this.panorama.lon = lon;
        this.panorama.lat = lat;
        if (needDrawScene)
            this.panorama.drawScene();

    },

    // device_motion() method
    device_motion: function(e) {

        if (!this.devicemotion.move.active || !this.orientation.landscape)
            return;

        // limit ticks rate
        this.device.ticks++;
        if (this.device.ticks <= this.devicemotion.nth)
            return;
        else
            this.device.ticks = 0;

        // rotation
        var rotation = e.rotationRate;
        var x, y, z = 0;
        x = rotation.alpha;
        y = rotation.beta;

        // noise
        var noise = this.devicemotion.move.noise;
        if (x > -noise && x < noise)
            x = 0;
        if (y > -noise && y < noise)
            y = 0;

        // update
        var needDrawScene = (x != 0 || y != 0);

        // move
        this.panorama.lon -= x / this.devicemotion.move.sensivity;
        this.panorama.lat -= y / this.devicemotion.move.sensivity;
        if (needDrawScene)
            this.panorama.drawScene();

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
