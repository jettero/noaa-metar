#!/bin/bash

(
    for i in *-decode.tar.bz2; do
        tar -jxOf $i 
    done

) | grep -Er --line-buffered --color=auto -C10 ${1:-KAZO}
