/*
 * freepano - WebGL panorama viewer
 *
 * Copyright (c) 2014 FOXEL SA - http://foxel.ch
 * Please read <http://foxel.ch/license> for more information.
 *
 *
 * Author(s):
 *
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

var toasts={};
function notify(message,options){

  console.log(message);
  console.trace();

  $("#status").hide();
  if (typeof(loading_intvl)!='undefined' && loading_intvl) clearInterval(loading_intvl);

  var _options={
     type: 'error',
     sticky: true,
     position: 'top-left'
  }
  if (typeof(options)=="object") {
    $.extend(_options,options);
  }
  if (typeof(message)=="string") {
    _options.text=message;
  }
  if (typeof(message)=="object") {
    $.extend(_options,options);
  }
  var msgid=btoa(_options.text);

  if (toasts[msgid]) return;

  toasts[msgid]={
    close: function(){}
  };

  if (_options.close) {
    toasts[msgid].close=_options.close;
  }
  _options.close=function(){
    toasts[msgid].close();
    delete(toasts[msgid]);
  }

  return toasts[msgid].toast=$().toastmessage('showToast',_options);

}

$.notify=notify;


