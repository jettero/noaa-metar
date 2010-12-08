#!/usr/bin/perl

use common::sense;
use Scalar::Util qw(looks_like_number);

while(<>) {
    s/\%\s*([^%,]+)\s*,\s*([^%]+)\s*\%/process_one($1,$2)/eg;

    print $_;
}

sub process_one {
    my ($field, $default) = @_;
    my $val = $default;

    $val = $ENV{"NM_$field"} if exists $ENV{"NM_$field"};

    return process_value($val);
}

sub process_value {
    my $val = shift;

    return "undefined" unless defined $val;
    return "undefined" if $val eq "undefined";
    return "undefined" if $val eq "undef";
    return "null"  if $val eq "null";
    return "false" if $val eq "false";
    return "true"  if $val eq "true";

    return $val if $val =~ m/^[\[\{]/; # objects

    return $val if looks_like_number($val);
    return "\"$val\"";
}
