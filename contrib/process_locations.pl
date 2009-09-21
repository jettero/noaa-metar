#!/usr/bin/perl

use strict;
use warnings;
use XML::CuteQueries;
use File::Slurp qw(write_file);
use JSON qw(to_json);

my $CQ = XML::CuteQueries->new->parsefile("contrib/Locations.xml");

my %q = (
    region => {
        '<RE>_name' => '',
        '[]country' => {
            '<RE>_name' => '',
            '[]state' => {
                '<RE>_name' => '',
                '[]location' => {
                    '<RE>_name' => '',
                    code => '',
                    zone => '',
                    radar => '',
                }
            }
        }
    }
);

my %res;
for my $region ($CQ->cute_query({nostrict_match=>1}, %q)) {
    for my $country (@{ $region->{country} }) {
        for my $state (@{ $country->{state} }) {
            for my $location (@{ $state->{location} }) {
                next unless $location->{code} and $location->{zone};
                next unless $location->{radar};

                # print "$region->{_name} $country->{_name} $state->{_name} $location->{_name}\n";
                # print "code: $location->{code}; zone: $location->{zone}; radar: $location->{radar}\n";
                # warn "country: $country->{_name}; state/location: $state->{_name}/$location->{_name}\n";

                $res{ "$country->{_name} $state->{_name}/$location->{_name}" } = {
                    code  => $location->{code},
                    zone  => $location->{zone},
                    radar => $location->{radar} 
                };
            }
        }
    }
}

my $js = to_json(\%res);
   $js =~ s/:{/:\n{/g;

write_file( "locations.js" => $js );
