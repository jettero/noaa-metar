
use common::sense;
use Test;
use Tie::IxHash;
use t::test_metar;

tie my %metar, 'Tie::IxHash', (
    '150053Z'   => qr/(2010.*14|14.*2010)/, # this is hard to test since it varies from locale to locale
    '18008KT'   => qr/./,
    '10SM'      => qr/./,
    'FEW070'    => qr/./,
    '04/M01'    => qr/./,
    'A2986'     => qr/./,
    'RMK'       => qr/./,
    'AO2'       => qr/./,
    'SLP118'    => qr/./,
    'T00391011' => qr/./,
);

my $decode  = t::test_metar::process_metar(keys %metar);

plan tests => (keys %metar) + 0;

for( keys %metar ) {
    warn " $_ was undefined\n" unless defined $decode->{$_};
    ok( $decode->{$_}, $metar{$_} )
}
