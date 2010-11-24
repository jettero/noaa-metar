
use common::sense;
use Test;
use Tie::IxHash;
use t::test_metar;

tie my %metar, 'Tie::IxHash', (
    '150053Z'   => qr/(2010.*14|14.*2010)/, # this is hard to test since it varies from locale to locale

    RMK  => qr/remarks/,

    # picking up from remarks_2 on 12.7.1(s)
    'CB W MOV E' => qr/cumulonimbus west of station moving east/,
    'CB DSNT W'  => qr/distant cumulonimbus to the west/,
    'TCU W'      => qr/towering cumulonimbus to the west/,
    'ACC NW'     => qr/altocumulus to the north-west/,
    'APRNT ROTOR CLD NE' => qr/seriously?/,
    'CCSL S' => qr/we can code this, but aprnt rotor cld might be too much natural language to parse/,
);

my $decode  = t::test_metar::process_metar(keys %metar);

plan tests => (keys %metar) + 0;

for( keys %metar ) {
    warn " $_ was undefined\n" unless defined $decode->{$_};
    ok( $decode->{$_}, $metar{$_} )
}
