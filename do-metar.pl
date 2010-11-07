#!/usr/bin/perl

use common::sense;
use t::test_metar;
use Data::Dump qw(dump);

my $metar = t::test_metar::process_metar(@ARGV);
my $keyln = 0;

for (keys %$metar) {
    $keyln = length if length>$keyln;
}

$keyln ++;

for (keys %$metar ){
    print sprintf('%*s %s', $keyln, $_, $metar->{$_}), "\n";
}
