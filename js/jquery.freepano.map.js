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
 * Contributor(s):
 *
 *      Luc Deschenaux <l.deschenaux@foxel.ch>
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

    show: function map_show(map) {

        // dom
        var pano = map.panorama;
        var container = $(pano.container);

        // Create map container
        var mapContainer = $('<div>',{
            id: 'mapContainer'
        });

        // Append map
        container.append(mapContainer);

        var zoom = {
            base: 4,
            min: 3,
            max: 25,
            native: 18,
            bounds: 18
        };

        // Create leaflet map object
        var map = L.map('mapContainer', {
            keyboard: false,
            scrollWheelZoom: true,
            minZoom: zoom.min,
            maxZoom: zoom.max
        }).setView([51.505, -0.09], zoom.base);

        // add an OpenStreetMap tile layer
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            minZoom: zoom.min,
            maxZoom: zoom.max,
            maxNativeZoom: zoom.native
        }).addTo(map);

        // Compute icon sizes and anchors
        var iconSize     = [22.5, 36.25];
        var shadowSize   = [40.75, 36.25];
        var iconAnchor   = [iconSize[0] / 2, 36.25];
        var shadowAnchor = [iconSize[0] / 2, 36.25];

        // Create marker icon
        var markerIcon = L.icon({
            iconUrl:     'img/marker_icon.png', // Icon image file path
            shadowUrl:   'img/marker_shadow.png', // Shadow image file path

            iconSize:     iconSize, // size of the icon
            shadowSize:   shadowSize, // size of the shadow

            iconAnchor:   iconAnchor, // point of the icon which will correspond to marker's location
            shadowAnchor: shadowAnchor,  // the same for the shadow

            popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
        });

        // Create highlighted marker icon
        var markerIcon_Highlighted = L.icon({
            iconUrl:     'img/marker_icon_highlight.png', // Icon image file path
            shadowUrl:   'img/marker_shadow.png', // Shadow image file path

            iconSize:     iconSize, // size of the icon
            shadowSize:   shadowSize, // size of the shadow

            iconAnchor:   iconAnchor, // point of the icon which will correspond to marker's location
            shadowAnchor: shadowAnchor,  // the same for the shadow

            popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
        });

        var markers = [];

        // Iterate over panoramas and create markers
        $.each(pano.list.images, function( index, value ) {

            // No geo coordinates
            if (value.coords === undefined || value.coords === null)
                return;

            // Icon
            var icon = markerIcon;

            // Use first image if currentImage is not defined
            if (pano.list.currentImage === undefined)
                pano.list.currentImage = Object.keys(pano.list.images)[0];

            // Determine if the marker is highlighted
            if ( pano.list.currentImage == index )
                icon = markerIcon_Highlighted;

            // Create marker
            var marker = L.marker([value.coords.lat, value.coords.lon], {icon: icon})
            .on('click', function(e) {

                // Reset all markers to default icon
                $.each(markers, function( index, value ) {
                    value.setIcon(markerIcon);
                });

                // Set highlighted icon for marker
                marker.setIcon(markerIcon_Highlighted);

                // Check if panorama has changed, then change it
                if(e.target.panorama.index != pano.list.currentImage)
                    pano.list.show(e.target.panorama.index);
            });

            // Extend marker with panorama object
            $.extend( marker, {
                panorama: {
                    index: index,
                    value: value
                }
            });

            // Add marker to array
            markers.push( marker )

            // Add marker to map
            marker.addTo(map)

        });

        // No elligible markers
        if (markers.length == 0) {
            this.hide(this);
            return;
        }

        // Create makers featureGroup
        var markersGroup = new L.featureGroup(markers);

        // Fit map to markers
        map.fitBounds(markersGroup.getBounds());

        // Unzoom from bounds
        if (map.getZoom() > zoom.bounds)
            map.setZoom(zoom.bounds);
        else
            map.setZoom(map.getZoom()-1);

    },

    hide: function map_hide(map) {
        $("#mapContainer").remove();
    },

    init: function map_init() {
        var map = this;

        if (map.active)
            map.show(map);

        // watch touch move properties
        watch(map,['active'], function() {
            if (map.active)
                map.show(map);
            else
                map.hide(map);
        });

        map.callback();
    }

});

// register freepano.map plugin

$.extend(Map.prototype,{
    // save pointer to Panorama.prototype.init in Map.prototype
    panorama_init: Panorama.prototype.init
});

$.extend(Panorama.prototype,{

  // hook Map.prototype.init to Panorama.prototype.init
  init: function panorama_init() {

    var panorama=this;

    // skip Map instantiation if map preferences undefined in panorama
    if (panorama.map!==undefined) {

      // or if map is already instantiated
      if (!(panorama.map instanceof Map)) {

        // intantiate map
        panorama.map=new Map($.extend(true,{

          // pass panorama instance pointer to map instance
          panorama: panorama,

          // to be run when map is instantiated
          callback: function() {

            // chain with old panorama.prototype.init on callback
            Map.prototype.panorama_init.call(panorama);

          }

        },panorama.map));

      }

    } else {

      // chain with old panorama.prototype.init
      Map.prototype.panorama_init.call(panorama);

    }
  }
});

