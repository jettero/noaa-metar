
use common::sense;
use Test;
use Tie::IxHash;
use t::test_metar;

tie my %metar, 'Tie::IxHash', (
    '150053Z'   => qr/(2010.*14|14.*2010)/, # this is hard to test since it varies from locale to locale
    '18008KT'   => qr/8 knots.*180⁰/,
    '10SM'      => qr/visibility is 10 statute miles/,
    'M10SM'     => qr/less than.*?10/,
    'M1 1/4SM'  => qr/less than.*?1\.25/,
    '1 1/4SM'   => qr/visibility is 1\.25 statute/,
    FEW003      => qr/few.*300 ft/,
    SCT005      => qr/scattered.*500 ft/,
    BKN009      => qr/broken.*900 ft/,
    OVC010      => qr/overcast.*1000 ft/,
    VV004       => qr/visibility.*400 ft/,
    SCT030TCU   => qr/scattered.*towering.*3000 ft/,
    CLR         => qr/clear.*automated/,
    SKC         => qr/clear/,
    '04/M01'    => qr/temp.*4⁰C.*dew.*-1⁰C/,
    A2986       => qr/altimeter.*29\.86 inHg/,
    RMK         => qr/remarks/,
    AO2         => qr/automated.*precip/,
    SLP118      => qr/pressure.*1011\.8 hPa/,
    T00391011   => qr/hourly.*3.9⁰C.*-1.1⁰C/,
);

my $decode  = t::test_metar::process_metar(keys %metar);

plan tests => (keys %metar) + 0;

for( keys %metar ) {
    warn " $_ was undefined\n" unless defined $decode->{$_};
    ok( $decode->{$_}, $metar{$_} )
}
