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


// closure
(function($,Panorama){


/*
 * RemoteControls
 * Class Constructor
 */
function RemoteControls(options) {

    if (!(this instanceof RemoteControls))
        return new RemoteControls(options);

    $.extend(true,this,this.defaults,options);

} // RemoteControls Constructor


/*
 * RemoteControls
 * Class Prototype
 */
$.extend(true,RemoteControls.prototype, {

    defaults: {
        socket: null
    }, // defaults

    /**
     * on_panorama_init()
     * Event triggered on panorama init. Socket and Device Motion init.
     *
     * @return  void
     */
    on_panorama_init: function remotecontrols_on_panorama_init() {

        var panorama = this;

        // remote not active
        if (!panorama.controls.devicemotion.move.remote)
            return;

        // register socket
        if (this.socket == null) {

            // io
            this.socket = io.connect('http://'+window.location.hostname+':3000/');

            // pass controls
            window._controls_devicemotion = panorama.controls;

            // socket event
            this.socket.on('remotecontrols', function(e){
                panorama.controls.onDeviceMotionMove(e);
            });

            // qr code
            var qrcode = $('<div>',{'class':'remoteqrcode'});
            var img = $('<img>',{src:'http://'+window.location.hostname+':3000/qrcode',alt:''});
            $(panorama.container).append(qrcode.append(img));

        }

    } // remotecontrols_on_panorama_init

});


/*
 * RemoteControls
 * Event Dispatcher
 */
Panorama.prototype.dispatchEventsTo(RemoteControls.prototype);


// closure
})(jQuery,Panorama);
