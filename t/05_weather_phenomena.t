
use common::sense;
use Test;
use Tie::IxHash;
use t::test_metar;

tie my %metar, 'Tie::IxHash', (
    '150053Z'  => qr/(2010.*14|14.*2010)/, # this is hard to test since it varies from locale to locale
    RA         => "rain",
    -RA        => "light rain",
    '+RA'      => "heavy rain",
    RASN       => "rain and snow",
    RASNGS     => qr"rain, snow and small hail",
    VCFC       => "funnel cloud in the vicinity",
    "+VCRA"    => "rain (heavy) in the vicinity", # illegal, but supported
    RMK        => qr/remarks/,
    RAB22      => qr/rain began.*?:22/, # the hours depend on the locale
    RAB1722    => qr/rain began.*?:22/, # the hours still depend on the locale, 17->12 in my case, ymmv
    SNGSRAB22  => qr/snow.*?hail.*?rain.*?began.*?:22/,
    RAE22      => qr/rain ended.*?:22/,
    RAE1722    => qr/rain ended.*?:22/,
    SNGSRAE22  => qr/snow.*?hail.*?rain.*?ended.*?:22/,
    RAB22E29   => qr/rain.*?began.*?:22.*?ended.*?:29/,
    SNRAB22E29 => qr/snow.*?rain.*?began.*?:22.*?ended.*?:29/,
);

my $decode  = t::test_metar::process_metar(keys %metar);

plan tests => (keys %metar) + 0;

for( keys %metar ) {
    warn " $_ was undefined\n" unless defined $decode->{$_};
    ok( $decode->{$_}, $metar{$_} )
}
