/*
 * freepano - WebGL panorama viewer
 *
 * Copyright (c) 2014,2015 FOXEL SA - http://foxel.ch
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
    if (!(this instanceof Map)) {
      return new Map(options);
    }

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
        active: true,

        // leaflet defaults
        leaflet: {

            // see http://leafletjs.com/reference.html#tilelayer-options
            tileLayer: {

                url_template: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',

                options: {
                     attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                }

            },

            origin: [51.505, -0.09], // default geographical coordinates

            zoom: {
                base: 4,
                min: 3,
                max: 25,
                native: 18,
                bounds: 18
            },

            // see http://leafletjs.com/reference.html#map-zoompanoptions
            zoompan_options: undefined,

            icon: {
                iconUrl: 'img/marker_icon.png', // marker icon url
                shadowUrl: 'img/marker_shadow.png', // marker shadow image url
                iconSize: [22.5, 36.25], // marker size
                shadowSize: [40.75, 36.25], // marker shadow size
                iconAnchor: [22.5/2, 36.25], // point corresponding to marker's location
                shadowAnchor: [22.5/2, 36.25],
                popupAnchor: [0, 0] // point from which menu should popup relative to the iconAnchor
            },

            icon_highlighted: {
                iconUrl:     'img/marker_icon_highlight.png',
                shadowUrl:   'img/marker_shadow.png'
            }
        }
    },

    show: function map_show() {

        var map=this;
        var panorama = map.panorama;

        // map container exists ?
        if (map.container && map.container.length) {
            // then show map if hidden and/or return
            if (!$(map.container).is(':visible')) {
                map.container.show();
                map.dispatch('ready');
            }
            return;
        }

        // Append map
        map.container = $('<div>',{'class':'map'});
        $(panorama.container).append(map.container);

        // Create leaflet map object
        var leaflet = map.leaflet.instance = L.map(map.container[0], {
            keyboard: false,
            scrollWheelZoom: true,
            minZoom: map.leaflet.zoom.min,
            maxZoom: map.leaflet.zoom.max
        }).setView(map.leaflet.origin, map.leaflet.zoom.base, map.leaflet.zoompan_options);

        // add a tile layer
        L.tileLayer(map.leaflet.tileLayer.url_template, $.extend(true,{},map.leaflet.tileLayer.options,{
            minZoom: map.leaflet.zoom.min,
            maxZoom: map.leaflet.zoom.max,
            maxNativeZoom: map.leaflet.zoom.native
        })).addTo(leaflet);

        // Create marker icon
        map.markerIcon = L.icon(map.leaflet.icon);

        // Create highlighted marker icon
        map.markerIcon_Highlighted = L.icon($.extend(true,{},map.leaflet.icon,map.leaflet.icon_highlighted));

        var markers = map.markers = [];

        // Iterate over panoramas and create markers
        $.each(panorama.list.images, function( index, image ) {

            // No geo coordinates
            if (image.coords === undefined || image.coords === null)
                return;

            // Use initial image if set and currentImage is not defined
            if (panorama.list.currentImage === undefined && panorama.list.initialImage !== undefined)
                panorama.list.currentImage = panorama.list.initialImage;

            // Use first image if currentImage is not defined
            else if (panorama.list.currentImage === undefined)
                panorama.list.currentImage = Object.keys(panorama.list.images)[0];

            // set marker icon
            var icon = (panorama.list.currentImage==index) ?
              map.markerIcon_Highlighted :
              map.markerIcon;

            // Create marker
            var marker = L.marker([image.coords.lat, image.coords.lon], {icon: icon})
            .on('click', function(e) {

                var panorama=e.target.panorama.instance;
                var map=panorama.map.instance;

                // Check if panorama has changed, then change it
                var changed = (e.target.panorama.index != panorama.list.currentImage);

                if (changed) {

                  // Reset current marker to default icon
                  if (map.currentMarker) {
                    map.currentMarker.setIcon(map.markerIcon);
                  }

                  // Set target marker icon
                  e.target.setIcon(map.markerIcon_Highlighted);

                  map.currentMarker=e.target;
                  panorama.list.show(e.target.panorama.index);

                }

                // Spread event
                $(map).trigger('markerclick',{changed:changed,target:e.target.panorama.index});

            });

            if (panorama.list.currentImage==index) {
              map.currentMarker=marker;
            }

            // Reference panorama instance and list index
            marker.panorama={
              instance: panorama,
              index: index
            };

            // Add marker to array
            markers.push( marker )

            // Add marker to map
            marker.addTo(leaflet)

        });

        // No elligible markers
        if (markers.length == 0) {
            this.hide();
            return;
        }

        // Create makers featureGroup
        var markersGroup = new L.featureGroup(markers);

        // Fit map to markers
        leaflet.fitBounds(markersGroup.getBounds());

        // Unzoom from bounds
        if (leaflet.getZoom() > map.leaflet.zoom.bounds)
            leaflet.setZoom(map.leaflet.zoom.bounds);
        else
            leaflet.setZoom(leaflet.getZoom()-1);

        // map is ready
        map.dispatch('ready');

    }, // map_show

    hide: function map_hide() {
        $('.map',this.panorama.container).hide();
    },

    remove: function map_remove() {
        $('.map',this.panorama.container).remove();
    },

    on_panorama_ready: function map_on_panorama_ready() {

        var panorama=this;

        // skip Map instantiation if map preferences undefined in panorama
        if (panorama.map!==undefined) {

          // or if map is already instantiated
          if (!(panorama.map.instance instanceof Map)) {

            // instantiate map
            panorama.map.instance=new Map($.extend(true,{

              // pass panorama instance pointer to map instance
              panorama: panorama

            },panorama.map));

          }

          if (panorama.map.instance && panorama.map.instance.active) {
            panorama.map.instance.show();
            panorama.map.instance.updateCurrentMarker();
          }

        }

    }, // map_on_panorama_ready

    init: function map_init() {

        var map=this;

        // set watcher for active flag
        watch(map,['active'], function() {
            if (map.active)
                map.show();
            else
                map.hide();
        });

    }, // map_init

    updateCurrentMarker: function(){
      var map=this;
      var currentImage=map.panorama.list.currentImage;
      map.currentMarker.setIcon(map.markerIcon);
      $.each(map.markers,function(){
        var marker=this;
        if (marker.panorama.index==currentImage) {
          map.currentMarker=marker;
          marker.setIcon(map.markerIcon_Highlighted);
          return false;
        }
      });
    }

});

// setup Map event dispatcher
setupEventDispatcher(Map.prototype);

// subscribe to panorama events
Panorama.prototype.dispatchEventsTo(Map.prototype);
