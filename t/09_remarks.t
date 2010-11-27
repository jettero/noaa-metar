
use common::sense;
use Test;
use Tie::IxHash;
use t::test_metar;

tie my %metar, 'Tie::IxHash', (
    '150053Z'   => qr/(2010.*14|14.*2010)/, # this is hard to test since it varies from locale to locale

    RMK  => qr/remarks/,

    'TWR VIS 1 1/2'      => qr/tower visibility is 1\.5/,
    'SFC VIS 1 1/2'      => qr/surface visibility is 1\.5/,
    'VIS 1/4V5'          => qr/visibility varies between 0\.25.*?and.*?5/,
    'VIS NE 1/4'         => qr/visibility.*?0\.25.*?north-east/,
    'VIS 1 1/4 RWY11'    => qr/visibility.*?1\.25.*?RWY11/,
);

my $decode  = t::test_metar::process_metar(keys %metar);
plan tests => (keys %metar) + 1;

for( keys %metar ) {
    warn " $_ was undefined\n" unless defined $decode->{$_};
    ok( $decode->{$_}, $metar{$_} )
}

ok( $decode->{other}, undef );
