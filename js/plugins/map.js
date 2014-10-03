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

// Plugin constructor
function Map(options)
{
    // merge specified options with default options and extend this instance
    $.extend(true,this,Map.prototype.defaults,options);

    // Initialize plugin
    this.init();
}

// Extend plugin prototype
$.extend(true, Map.prototype, {

    // default values
    defaults: {

        // active
        active: false

    },

    // [private] _register_mapView() method
    _register_mapView: function(map) {

        // dom
        var pano = map.panorama;
        var container = $(pano.container);
        var panoramas = pano.list.images;

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

        // Create highlighted eyesis icon
        var eyesisIcon_Highlighted = L.icon({
            iconUrl:     'img/eyesis_icon_highlight.png', // Icon image file path
            shadowUrl:   'img/eyesis_shadow.png', // Shadow image file path

            iconSize:     iconSize, // size of the icon
            shadowSize:   shadowSize, // size of the shadow

            iconAnchor:   iconAnchor, // point of the icon which will correspond to marker's location
            shadowAnchor: shadowAnchor,  // the same for the shadow

            popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
        });

        // Markers array
        var Markers = [];

        // Retrive actual panorama name
        var Pano = $("#pano").data("pano");

        // Iterate over panoramas and create markers
        $.each(panoramas, function( index, value ) {

            // Determine if the marker is highlighted
            var Icon = eyesisIcon;

            if ( Pano.list.currentImage == index )
                Icon = eyesisIcon_Highlighted;

            // Create marker
            var Marker = L.marker([value.coords.lat, value.coords.lon], {icon: Icon})
            .on('click', function(e) {

                // Reset all markers to default icon
                $.each(Markers, function( index, value ) {
                    value.setIcon(eyesisIcon);
                });

                // Set highlighted icon for marker
                Marker.setIcon(eyesisIcon_Highlighted);

                // Check if panorama has changed, then change it
                if(e.target.panorama.index != Pano.list.currentImage)
                    Pano.list.show(e.target.panorama.index);
            });

            // Extend marker with panorama object
            $.extend( Marker,
            {
                panorama: {
                    index: index,
                    value: value
                }
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

    ready: function ready(){
    },

    init: function init(){

        // Get map object
        var map = this;

        // Initialize map view
        map._init_map();

    }

});
