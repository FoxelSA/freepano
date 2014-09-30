/*
 * freepano - WebGL panorama viewer
 *
 * Copyright (c) 2014 FOXEL SA - http://foxel.ch
 * Please read <http://foxel.ch/license> for more information.
 *
 *
 * Author(s):
 *
 *      Kevin Velickovic <k.velickovic@foxel.ch>
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
 * Map constructor
 */
function Map(options) {

    // Check instance
    if (!(this instanceof Map))
        return new Map(options);

    // Extend plugin
    $.extend(true, this, this.defaults, options);

    // Initialize plugin
    this.init();

}

/**
 * Extends Map prototype
 */
$.extend(true, Map.prototype, {

    // default values
    defaults: {

        // active
        active: false

    },

    // Function to load a panorama dynamicaly
    LoadPanorama: function(Pano)
    {
        // Get panorama sphere
        var Sphere = $("#pano").data("pano").sphere;

        // Get panorama objects
        var Objects = $("#pano").data("pano").sphere.object3D.children;

        // Change panorama paths
        $.extend( Sphere.texture, Pano);

        // Unload previous tiles
        for(var i = 0; i < Objects.length; i++)
        {
            // Unload mesh texture
            Objects[i].material.dispose();
        }

        // Refesh scene
        $("#pano").data("pano").drawScene()

        // Loop index
        var idx = 0;

        // Iterate over columns and rows
        for( var col = 0; col < Pano.columns; col++ ) {

            for( var row = 0; row < Pano.rows; row++ ) {

                // Calculate texture filename
                var Texture = Pano.dirName + '/' + Pano.baseName + '_' + row + '_' + col + '.jpg';

                // Tell to update this tile
                Objects[idx].material.needsUpdate = true;

                // Change and refresh tile texture when material is loaded
                Objects[idx].material.map = THREE.ImageUtils.loadTexture( Texture, THREE.UVMapping, function() {

                    // Refesh scene
                    $("#pano").data("pano").drawScene()

                });

                // Increment loop index
                idx++;

            }

        }
    },

    // Function to retrive HTML hash arguments
    GetHashParameter: function(sParam)
    {
        // Retrive arguments without the '#'
        var sPageURL = window.location.hash.substring(1);

        // Extract arguments
        var sURLVariables = sPageURL.split('&');

        // Iterate over arguments
        for (var i = 0; i < sURLVariables.length; i++)
        {

            // Read variable
            var sParameterName = sURLVariables[i].split('=');

            // Ckeck parameter and return result
            if (sParameterName[0] == sParam)
            {
                return sParameterName[1];
            }
        }
    },

    // [private] _register_mapView() method
    _register_mapView: function(map) {

        // dom
        var container = $(map.panorama.container);
        var panoramas = map.panorama.tiles;

        // Create map container
        var mapContainer = $('<div>',{'id':'mapContainer'});

        // Append map
        container.append(mapContainer);

        // Create leaflet map object
        var map = L.map('mapContainer').setView([51.505, -0.09], 0);

        // add an OpenStreetMap tile layer
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Compute icon sizes and anchors
        var iconSize     = [22.5, 36.25];
        var shadowSize   = [40.75, 36.25];
        var iconAnchor   = [iconSize[0] / 2, 36.25];
        var shadowAnchor = [iconSize[0] / 2, 36.25];

        // Create eyesis icon
        var eyesisIcon = L.icon({
            iconUrl:     'img/eyesis_icon.png', // Icon image file path
            shadowUrl:   'img/eyesis_shadow.png', // Shadow image file path

            iconSize:     iconSize, // size of the icon
            shadowSize:   shadowSize, // size of the shadow

            iconAnchor:   iconAnchor, // point of the icon which will correspond to marker's location
            shadowAnchor: shadowAnchor,  // the same for the shadow

            popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
        });

        // Markers array
        var Markers = [];

        // Iterate over panoramas and create markers
        $.each(panoramas, function( index, value ) {

            // Create marker
            var Marker = L.marker([value.lat, value.lon], {icon: eyesisIcon})
            .on('click', function(e) {

                // Retrive actual panorama name
                var OriginPanorama = $("#pano").data("pano").sphere.texture.baseName;

                // Check if panorama has changed, then change it
                if(e.target.panorama.baseName != OriginPanorama)
                    Map.prototype.LoadPanorama(e.target.panorama);
            });

            // Extend marker with panorama object
            $.extend( Marker,
            {
                panorama: value
            });

            // Add marker to array
            Markers.push( Marker )

            // Add marker to map
            Marker.addTo(map)

        });

        // Create makers featureGroup
        var MarkersGroup = new L.featureGroup(Markers);

        // Fit map to markers
        map.fitBounds(MarkersGroup.getBounds());

    },

    // [private] _unregister_mapView() method
    _unregister_mapView: function(map) {
        $("#mapContainer").remove();
    },

    // init() method
    init: function() {

        var map = this;

        // callback!
        map.callback();

    },

    // ready() method
    ready: function(callback) {

        var map = this;

        // Map initialization
        map._init_map();

        // callback!
        callback();

    },

    // [private] _init_map() method
    _init_map: function() {

        // Get map object
        var map = this;

        // touch move
        if (map.active)
            map._register_mapView(map);

        // watch touch move properties
        watch(map,['active'], function() {
            if (map.active)
                map._register_mapView(map);
            else
                map._unregister_mapView(map);
        });

    },

    // panorama_init() method
    panorama_init: Panorama.prototype.init,

    // panorama_ready() method
    panorama_ready: Panorama.prototype.ready

});

/**
 * Extends Panorama prototype
 */
$.extend(Panorama.prototype, {

    // init() method
    init: function() {

        // Get panorama object
        var panorama = this;

        // map is defined in freepano options, instanciate it.
        if (typeof panorama.map !== 'undefined') {

            if (!(panorama.map instanceof Map)) {

                // convert options to instanciated class
                panorama.map = new Map($.extend(true , {
                    panorama: panorama,
                    callback: function() {

                        // Can init function
                        Map.prototype.panorama_init.call(panorama);

                    }
                },panorama.map));

            }

        } else {

            // Can init function
            Map.prototype.panorama_init.call(panorama);

        }

    },

    // ready() method
    ready: function() {

        // Get panorama object
        var panorama = this;

        // map is defined in freepano options, instanciate it.
        if (typeof panorama.map !== 'undefined' && typeof panorama.map.ready === 'function') {

            panorama.map.ready(function() {

                // Call ready function
                Map.prototype.panorama_ready.call(panorama);

            });

        } else {

            // Call ready function
            Map.prototype.panorama_ready.call(panorama);

        }

    }

});
