
use common::sense;
use Test;
use Tie::IxHash;
use t::test_metar;

tie my %metar, 'Tie::IxHash', (
    '150053Z'   => qr/(2010.*14|14.*2010)/, # this is hard to test since it varies from locale to locale
    '18008KT'   => qr/8 knots.*180⁰/,
    '10SM'      => qr/10 statute/,
    'FEW070'    => qr/few.*7000 ft/,
    '04/M01'    => qr/temp.*4⁰C.*dew.*-1⁰C/,
    'A2986'     => qr/altimeter.*29\.86 inHg/,
    'RMK'       => qr/remarks/,
    'AO2'       => qr/automated.*precip/,
    'SLP118'    => qr/pressure.*1011\.8 hPa/,
    'T00391011' => qr/hourly.*3.9⁰C.*-1.1⁰C/,
);

my $decode  = t::test_metar::process_metar(keys %metar);

plan tests => (keys %metar) + 0;

for( keys %metar ) {
    warn " $_ was undefined\n" unless defined $decode->{$_};
    ok( $decode->{$_}, $metar{$_} )
}
