#!/usr/bin/perl

use common::sense;
use t::test_metar;
use Data::Dump qw(dump);

print dump(t::test_metar::process_metar(@ARGV)), "\n";
