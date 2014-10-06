/*
 * JSLoader - A simple JavaScript plugin architecture
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

// Plugin Loader main class
function JSLoader(options)
{

    // Default variables
    this.plugins = [];
    this.debug = false;

    // Function that registers plugins
    this.registerPlugin = function registerPlugin(_class)
    {
        // Debug stuff
        if( this.debug )
            console.log("[JSLoader]: Registering " + _class.constructor.name)

        // Push the plugin to the array
        this.plugins.push({
            name: _class.constructor.name,
            plugin: _class
        });
    }

    // Function that Unregisters plugins
    this.unRegisterPlugin = function unRegisterPlugin(_name)
    {
        // Iterate over plugins
        for( var i = 0; i < this.plugins.length; i++ )
        {
            // Check if the anme corresponds to the input one
            if( this.plugins[i].name == _name )
            {
                // Debug stuff
                if( this.debug )
                    console.log("[JSLoader]: Unregistering " + _name)

                // Remove plugin from array
                this.plugins.splice(i, 1);

                // Return result
                return true;
            }
        }

        // Return result
        return false;
    }

    // Function that call events
    this.callEvent = function callEvent(_event)
    {
        // Retrive additional specified arguments (without _event)
        var args = Array.prototype.slice.call(arguments).splice(1);

        // Debug stuff
        var debug = this.debug;

        // Iterate over plugins
        this.plugins.forEach(function(entry) {

            // Check presence of event in plugin
            if( entry.plugin[_event] !== undefined)
            {
                // Debug stuff
                if( debug )
                    console.log("[JSLoader]: Calling event " + _event + " for " + entry.name)

                // Call event with additional arguments
                entry.plugin[_event](args);
            } else {

                // Debug stuff
                if( debug )
                    console.log("[JSLoader]: Error calling event " + _event + " for " + entry.name + ", event not found")
            }
        });
    }

    // Get plugin by name
    this.getPlugin = function getPlugin(_pluginname)
    {
        // Find and return the corresponding plugin
        for( var i = 0; i < this.plugins.length; i++ )
        {
            if( this.plugins[i].name == _pluginname )
                return this.plugins[i].plugin;
        }
    }

    // Get plugin names
    this.listPluginNames = function listPluginNames()
    {
        // Create return object
        var List = [];

        // Retrive all plugin names
        this.plugins.forEach(function(entry) {
            List.push(entry.name);
        });

        // Return result
        return List;
    }

    // Register plugins
    if (options.plugins !== undefined)
    {
        for (var i = 0; i < options.plugins.length; i++ )
        {
            // Create new plugin instance
            var _class = new window[options.plugins[i]]();

            // Extends class
            if (options.patch !== undefined)
            {
                for (var property in options.patch) {
                    _class[property] = options.patch[property];
                }
            }

            // Register the plugin
            this.registerPlugin( _class );
        }
    }

}
