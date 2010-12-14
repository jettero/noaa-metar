#!/usr/bin/perl

use strict;
use warnings;
use File::Slurp qw(write_file slurp);
use JSON qw(to_json);
use HTML::TreeBuilder;

=over

=item the goal looks like this:

   "Nevada, United States" : {
      "Winnemucca" : {
         "code" : "KWMC"
         // who knows what else might go in here some day
      },

=item example line

    <li><b>KAZO</b> (AZO) – <a href="/wiki/Kalamazoo/Battle_Creek_International_Airport" title="Kalamazoo/Battle Creek International Airport">Kalamazoo/Battle Creek International Airport</a>
                          – <a href="/wiki/Kalamazoo,_Michigan" title="Kalamazoo, Michigan">Kalamazoo</a>
                          / <a href="/wiki/Battle_Creek,_Michigan" title="Battle Creek, Michigan">Battle Creek, Michigan</a></li>

=item first problem line

    <li><b>KABE</b> (ABE) – <a href="/wiki/Lehigh_Valley_International_Airport" title="Lehigh Valley International Airport">Lehigh Valley International Airport</a>
                          – <a href="/wiki/Allentown,_Pennsylvania" title="Allentown, Pennsylvania">Allentown</a>,
                            <a href="/wiki/Bethlehem,_Pennsylvania" title="Bethlehem, Pennsylvania">Bethlehem</a> and <a href="/wiki/Easton,_Pennsylvania" title="Easton, Pennsylvania">Easton</a>,
                            <a href="/wiki/Pennsylvania" title="Pennsylvania">Pennsylvania</a></li>

=back

=cut

sub title_filter {
    my $element = shift;
    my $title   = $element->attr("title");

    $title =~ s/\s+\(page does not exist\)//;
    $title =~ s/\s+\(city\)//;

    return $title;
}

my %country_states = map {($_=>1)} ("Iraq", "United Arab Emirates", "Qatar", "Greece", "Italy", "Iceland", "Japan", "Romania");
my @states = ( "Alabama", "Alaska", "American Samoa", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia", "Guam", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts",
    "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New
    Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Northern Marianas Islands", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Puerto Rico", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Virgin Islands", "Washington", "West Virginia",
    "Wisconsin", "Wyoming", keys %country_states);

my $state_city_re = do { local $"="|"; my $s = "[^\\w]\\s+([^,]+),\\s+(@states)"; qr($s) };

my %res;
for my $locations_file (glob("contrib/locations-*.html")) {
    my $html = slurp($locations_file, {binmode=>":utf8"});
    my $tree = new HTML::TreeBuilder;
       $tree->parse($html);

    my ($ICAO_prefix) = $locations_file =~ m/([KP])\.html$/;
    my $airport_match = $ICAO_prefix . ($ICAO_prefix eq "K" ? "[A-Z]" :
        "[HAFOP]" # only Hawaii, and the various Alaskian IACO please
        ) . '[A-Z]{2}';

    for my $li ( $tree->find_by_tag_name("li") ) {
        my $li_html = $li->as_HTML;
        my $li_txt  = $li->as_text;

        next unless $li_html =~ m/<b>($airport_match)<\/b>/;
        next if $li_txt =~ m/abandoned/;

        my $ICAO = $1;
        my ($airport_a, @locs) = map {title_filter($_)} $li->find_by_tag_name("a");
        my ($loc) = grep {@$_==2} map {[split m/\s*,\s*/, $_]} @locs;

        unless( $loc ) {
            if( $li_txt =~ $state_city_re ) {
                $loc = [ $1, $2 ];

            } elsif( $ICAO eq "PAFR" ) {
                $airport_a = "Bryant Army Heliport - Fort Richardson";
                $loc = [ qw(Anchorage Alaska) ];

            } elsif( $ICAO eq "KNFG" ) {
                $loc = [ qw(Oceanside California) ];
            }
        }

        if( $loc ) {
            my ($city, $state) = @$loc;
            my $state_country  = "$state, United States";
            my $name           = $airport_a;
            my $desc           = "$ICAO: $name";

            $state_country = $loc->[1] if $country_states{$loc->[1]};

            $res{ $state_country }{ $desc } = {
                code    => $ICAO,
                name    => $name,
                'state' => $state,
                city    => $city,
            };

        } else {
            die "couldn't figure out: $li_txt\n$li_html\n";
        }
    }
}

my $js = to_json(\%res, {pretty=>1});
write_file( "locations.js" => "var location_data = $js;" );
