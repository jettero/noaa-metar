#!/bin/bash

for i in *-decode.tar.bz2; do
    tar -jxOf $i ${1:-kazo}.txt
done
