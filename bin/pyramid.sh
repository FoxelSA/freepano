#!/bin/bash
#  pyramid.sh
#
#
# freepano - WebGL panorama viewer
#
# Copyright (c) 2014-2015 FOXEL SA - http://foxel.ch
# Please read <http://foxel.ch/license> for more information.
#
#
# Author(s):
#
#      Luc Deschenaux <l.deschenaux@foxel.ch>
#
#
# This file is part of the FOXEL project <http://foxel.ch>.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
#
# Additional Terms:
#
#      You are required to preserve legal notices and author attributions in
#      that material or in the Appropriate Legal Notices displayed by works
#      containing it.
#
#      You are required to attribute the work as explained in the "Usage and
#      Attribution" section of <http://foxel.ch/license>.

#set -x

usage() {
  echo 'usage: pyramid [ -l <only_this_level> ] <tile_size> <filename> [<jpeg_quality>]'
  exit 1
}

if [ $# -lt 2 ] ; then
  usage
fi

if [ "$1" == "-l" ] ; then
  LEVEL=$2
  shift 2
fi

if [ $# -lt 2 -o $# -gt 3 ] ; then
  usage
fi

[ -n "$3" ] && QUALITY="-quality $3"
tilesize=$1
removedir=no

f=$2

  base=$(basename $f | sed -r -e 's/\.[^\.]+$//')

  echo image: $base
  [ -d $base -a "$removedir" = "yes" ] && rm -r $base
  mkdir -p $base || exit

  # get input resolution
  resolution=$(identify $f | sed -r -n -e 's/.* ([0-9]+x[0-9]+) .*/\1/p')
  echo input resolution: $resolution
  width=$(echo $resolution | cut -f 1 -d x)
  [ -z "$width" ] && exit
  height=$(echo $resolution | cut -f 2 -d x)
  [ -z "$height" ] && exit

  # get the highest output resolution (closest superior multiple of tilesize)
  # and make directories
  newwidth=$tilesize
  level=-1
  while [ $newwidth -lt $width ] ; do
    level=$(expr $level + 1)

    # if a single level is requested, dont bother with other directories
    if [ -z "$LEVEL" -o -n "$LEVEL" -a "$LEVEL" = "$level" ] ;  then
      mkdir -p $base/$tilesize/$level || exit
    fi

    newwidth=$(expr $newwidth \* 2)

  done

  bottom=$level
  echo pyramid levels: $(expr $bottom + 1)

  # resize original file if width not multiple of tilesize,
  tempfile=
  halfw=$(expr $newwidth / 2)
  if [ $width -ne $newwidth -o $height -ne $halfw ] ; then
    width=$newwidth
    height=$halfw

    # if a single level != bottom level is requested,
    # or bottom level is already done,
    # then just use the new width and height set above
    if [ -z "$LEVEL" -o -n "$LEVEL" -a "$LEVEL" = "$bottom" ] && [ ! -f $base/$tilesize/$bottom/done ]  ; then 
      tempfile=/tmp/tmp.$(basename $f).tiff
      convert $f -resize ${width}x$height\! -quality 100 $tempfile
      fref=$f
      f=$tempfile
    fi

  fi

  echo -n output resolution: $width\x$height

  # begin with higher resolution level
  level=$bottom
  curwidth=$width

  echo
  echo

  while [ $level -ge 0 ] ; do

    # skip level if flagged as 'done', or is not the specific level requested
    if [ -f $base/$tilesize/$level/done ] || [ -n "$LEVEL" -a "$level" != "$LEVEL" ]; then

      if [ -z "$LEVEL" -o -n "$LEVEL" -a -f $base/$tilesize/$level/done ]  ; then
        echo -n "level: $level - ${curwidth}x$(expr $curwidth / 2) "
        echo -n "- skipped"
        echo
        echo
      fi

    else

      echo -n "level: $level - ${curwidth}x$(expr $curwidth / 2) "

      if [ $level -eq $bottom ] ; then # higher resolution level

        # no need to resize the higher resolution level
        # just split f into tiles
        convert -crop ${tilesize}x${tilesize} +repage +adjoin $f $QUALITY ${base}_${level}.%05d.jpg || exit

      else # lower resolution levels

        # resize original image
        convert $f -resize ${curwidth}x$(expr $curwidth / 2)\! -quality 100 ${base}_${level}.jpg || exit

        # split into tiles
        convert -crop ${tilesize}x${tilesize} +repage +adjoin ${base}_${level}.jpg $QUALITY ${base}_${level}.%05d.jpg || exit

        # remove downscaled image
        rm ${base}_${level}.jpg

      fi

      # get tile count
      tilenum=$(ls -1 ${base}_${level}.?????.jpg | wc -l)

      echo -n "- $tilenum tiles - "

      # get grid dimensions
      colCount=$(expr $curwidth / $tilesize)
      rowCount=$(expr $curwidth / 2 / $tilesize)
      echo $colCount\x$rowCount

      # check tile count is matching file count
      truenum=$(expr $colCount \* $rowCount)
      if [ $tilenum -ne $truenum ] ; then
        echo tiles count and dimensions mismatch
        exit 1
      fi

      # move and rename tiles
      row=$(expr $rowCount - 1)
      col=$(expr $colCount - 1)
      echo -n "row: $row - "
      while [ $tilenum -gt 0 ] ; do
        echo -n \ $col
        tilenum=$(expr $tilenum - 1)
        N=$(printf %05d $tilenum)
        tile=$base/$tilesize/$level/${base}_${row}_${col}.jpg
        mv ${base}_${level}.$N.jpg $tile || exit
        if [ $col -eq 0 ] ; then
          row=$(expr $row - 1)
          [ $tilenum -gt 0 ] && ( echo ; echo -n "row: $row - " )
          col=$colCount
        fi
        col=$(expr $col - 1)
      done

      # flag level as done
      touch $base/$tilesize/$level/done

      echo
      echo

    fi

    # if we had to upscale the original file for higher resolution level,
    # restore f value to the original image filename for next downscales
    [ -n "$tempfile" ] && f=$fref

    # change level
    level=$(expr $level - 1)
    curwidth=$(expr $curwidth / 2)

  done

  [ -n "$tempfile" ] && rm $tempfile
  echo
