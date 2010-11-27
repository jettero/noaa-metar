
use common::sense;
use Test;
use Tie::IxHash;
use t::test_metar;

tie my %metar, 'Tie::IxHash', (
    '150053Z'   => qr/(2010.*14|14.*2010)/, # this is hard to test since it varies from locale to locale

    RMK  => qr/remarks/,

    # picking up from remarks_2 on 12.7.1(s)
    'CB W MOV E'         => qr/cumulonimbus west of station moving east/,
    'CB DSNT W'          => qr/distant cumulonimbus to the west/,
    'TCU W'              => qr/towering cumulonimbus to the west/,
    'ACC NW'             => qr/altocumulus to the north-west/,
    'APRNT ROTOR CLD NE' => qr/apparent rotor cloud to the north-east/,
    'CCSL S'             => qr/cirrocumulus clouds to the south/,

    'CIG 002RWY11' => qr/ceiling.*?RWY11.*?200/, # ceiling at secondary location

    PRESRR => qr/pressure rising rapidly/,
    PRESFR => qr/pressure falling rapidly/,

    'ACFT MSHP' => qr/aircraft mishap/,

    'SNINCR 2/10' => qr/snow increasing rapidly.*?last hour.*?2.*?on ground.*?10/, # 2in in last hour, 10in total depth
);

my $decode  = t::test_metar::process_metar(keys %metar);

plan tests => (keys %metar) + 0;

for( keys %metar ) {
    warn " $_ was undefined\n" unless defined $decode->{$_};
    ok( $decode->{$_}, $metar{$_} )
}
