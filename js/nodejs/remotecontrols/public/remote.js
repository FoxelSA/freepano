/*
 * freepano - WebGL panorama viewer
 *
 * Copyright (c) 2015 FOXEL SA - http://foxel.ch
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

$(document).ready(function() {

    var socket = null;
    var checked = false;

    /**
     * init()
     */
    function init() {

        // html5 device motion not available or not a mobile
        if (!window.DeviceMotionEvent || !$.browser.mobile)
            return;

        // io
        socket = io();

        // register event
        window.addEventListener('devicemotion',onDeviceMotion,false);

    } // init

    /**
     * onDeviceMotion()
     */
    function onDeviceMotion(e) {

        var compatible = true;

        // incomplete or not well-formatted event data
        if (!checked) {

            checked = true;

            if (typeof e.accelerationIncludingGravity !== 'object' || typeof e.rotationRate !== 'object'
                    || $.isEmptyObject(e.accelerationIncludingGravity) || $.isEmptyObject(e.rotationRate))
                compatible = false;
            else if (!$.isNumeric(e.accelerationIncludingGravity.x) || !$.isNumeric(e.accelerationIncludingGravity.y) || !$.isNumeric(e.accelerationIncludingGravity.z)
                    || !$.isNumeric(e.rotationRate.alpha) || !$.isNumeric(e.rotationRate.beta) || !$.isNumeric(e.rotationRate.gamma))
                compatible = false;

        }

        // compatible device
        if (checked && compatible) {

            // emit on socket.io
            socket.emit('deviceevent', {
                accelerationIncludingGravity: {
                    x: e.accelerationIncludingGravity.x,
                    y: e.accelerationIncludingGravity.y,
                    z: e.accelerationIncludingGravity.z
                },
                rotationRate: {
                    alpha: e.rotationRate.alpha,
                    beta: e.rotationRate.beta,
                    gamma: e.rotationRate.gamma
                }
            });
        }

    } // onDeviceMotion


    // initialize
    init();


});
