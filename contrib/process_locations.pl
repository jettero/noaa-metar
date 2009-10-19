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

my $html = slurp("contrib/locations.html");
my $tree = new HTML::TreeBuilder;
   $tree->parse($html);

sub title_filter {
    my $element = shift;
    my $title   = $element->attr("title");

    $title =~ s/\s+\(page does not exist\)//;
    $title =~ s/\s+\(city\)//;

    return $title;
}

my %res;
for my $li ( $tree->find_by_tag_name("li") ) {
    my $li_html = $li->as_HTML;
    next unless $li_html =~ m/<b>(K[A-Z]{3})<\/b>/;
    my $ICAO = $1;
    my ($airport_a, @locs) = $li->find_by_tag_name("a");

    for my $loc (@locs) {
        my $ltitle = title_filter($loc);
        my @L = split m/\s*,\s*/, $ltitle;

        unless( @L == 2 ) {
            local $" = ", ";
            warn "unhandled exception: wrong amount of city state (@L) in $ltitle";
            next;
        }

        my ($city, $state) = @L;
        my $state_country = "$state, United States";

        $res{ $state_country }{ $city } = {
            code => $ICAO,
            name => title_filter($airport_a),
        };
    }
}

my $js = to_json(\%res, {pretty=>1});
write_file( "locations.js" => "var location_data = $js;" );
