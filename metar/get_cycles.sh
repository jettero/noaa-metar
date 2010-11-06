#!/bin/bash

d=$(date +%Y-%m-%d)
mkdir -p $d

set -e

for i in {0..23}; do
    if [ $i -lt 10 ]; then
        z=0${i}Z
    else
        z=${i}Z
    fi

    if [ ! -f $d/$z.metar ]; then
        wget -c -T15 -t100 -O $z ftp://tgftp.nws.noaa.gov/data/observations/metar/cycles/$z.TXT
        grep '^[A-Z]' $z | sort -u | bzip2 > $d/$z.metar
        git add $d/$z.metar
        rm $z
    fi
done
