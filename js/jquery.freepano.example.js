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

/**
 * Class Constructor
 */
function Example(options) {

    if (!(this instanceof Example))
        return new Example(options);

    $.extend(true,this,this.defaults,options);
    this.init();

}

/**
 * Extends Class Prototype
 */
$.extend(true,Example.prototype, {

    // default values
    //
    // default values are automatically overrided if some are passed as
    // parameters on freepano instanciation. default values are not mandatory.
    //
    // as an example, an active flag state is set by default to false. see
    // /example/js/main.js to have a look how this flag is overrided on freepano
    // instanciation through example: { active: true }.
    defaults: {

        // example flag
        active: false

    },

    // init() method
    init: function example_init() {
        console.log('init() called on example module');
    },

    // on_panorama_preinit() method
    on_panorama_preinit: function example_on_panorama_preinit() {
        console.log('on_panorama_preinit() called on Example Module');
    },

    // on_panorama_init() method
    on_panorama_init: function example_on_panorama_init() {

        console.log('on_panorama_init() called on Example Module');

        // default values override
        //
        // by default freepano doesn't instanciate a module if there is no
        // options override set for it (see default values above).
        //
        // remove this test if your module must be started anyway.
        if (typeof this.example === 'undefined')
            return;

        // module instantiation
        //
        // depending your case, you may want to instanciate your module during
        // the init stage, pre-initialization (on_panorama_preinit()) stage or
        // even when the panorama is ready (on_panorama_ready()).
        if (!(this.example instanceof Example))
            this.example = new Example($.extend(true,{panorama:this},this.example));

    },

    // on_panorama_ready() method
    on_panorama_ready: function example_on_panorama_ready() {
        console.log('on_panorama_ready() called on Example Module');
    }

});

/**
 * Register Class Prototype on Events Dispatcher
 */
Panorama.prototype.dispatchEventsTo(Example.prototype);
