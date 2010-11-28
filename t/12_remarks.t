
use common::sense;
use Test;
use Tie::IxHash;
use t::test_metar;

tie my %metar, 'Tie::IxHash', (
    '150053Z'   => qr/(2010.*14|14.*2010)/, # this is hard to test since it varies from locale to locale

    RMK  => qr/remarks/,

    'CB W MOV E'         => qr/cumulonimbus west of station moving east/,
    'CB DSNT W'          => qr/distant cumulonimbus to the west/,
    'TCU W'              => qr/towering cumulonimbus to the west/,
    'ACC NW'             => qr/altocumulus to the north-west/,
  # 'APRNT ROTOR CLD NE' => qr/apparent rotor cloud to the north-east/,
    'CCSL S'             => qr/cirrocumulus clouds to the south/,

    'CIG 002RWY11' => qr/ceiling.*?RWY11.*?200/, # ceiling at secondary location
);

my $decode  = t::test_metar::process_metar(keys %metar);
plan tests => (keys %metar) + 1;

for( keys %metar ) {
    warn " $_ was undefined\n" unless defined $decode->{$_};
    ok( $decode->{$_}, $metar{$_} )
}

ok( $decode->{other}, undef );
