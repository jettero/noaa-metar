
use common::sense;
use Test;
use Tie::IxHash;
use t::test_metar;

tie my %metar, 'Tie::IxHash', (
    '150053Z'   => qr/(2010.*14|14.*2010)/, # this is hard to test since it varies from locale to locale

    RMK  => qr/remarks/,

    'PK WND 28045/15'   => qr/peak wind of 45 knots at 280.*?\d:15/, # the hour depends on the locale, any digit will do
    'PK WND 28045/1715' => qr/peak wind of 45 knots at 280.*?\d:15/, # the hour depends on the locale, any digit will do
    'WSHFT 30 FROPA'    => qr/wind shift with frontal passage at.*?\d:30/,
    'WSHFT 1930 FROPA'  => qr/wind shift with frontal passage at.*?\d:30/,
    'WSHFT 19'          => qr/wind shift at.*?\d:19/,
    'TWR VIS 1 1/2'     => qr/tower visibility 1\.5/,
    'SFC VIS 1 1/2'     => qr/surface visibility 1\.5/,
    'VIS 1/4V5'         => qr/visibility varies between 0\.25.*?and.*?5/,
    'VIS NE 1/4'        => qr/northeastern visibilty.*?0\.25/,
    'VIS 1 1/4 RWY11'   => qr/visibility 1\.25.*?RWY11/,

    # 12.7.1(j)(2)(a) clearly states that overhead shall not illicit a remark,
    # then presents this as an example.  part of me loves METAR, part of me
    # wants to write a stern letter about the inconsistences wrt machine
    # parsing and human code generation.  Oh wells. OHD is used in 12.7.1(j)(1)
    # before mentioned in 12.7.1(j)(2)(a).  

    # It seems, one day we could get fairly accruate about the distance from
    # the airport, ... iff the METAR itself is accurate enough.

    'OCNL LTGICCG OHD'  => qr/occasional lightning.*?within clouds.*?between cloud and ground.*?overhead/,
    'FRQ LTG VC'        => qr/frequent lightning in the vicinity/,
    'LTG DSNT W'        => qr/distant lightning to the west/,
    'LTGCCCA'           => qr/lightning.*?cloud to cloud.*?cloud to air/,

    'TS SE'             => qr/thunderstorm to the south-east/,
    'TS SE MOV NE'      => qr/thunderstorm to the south-east.*?moving north-east/,

    'GS 1 3/4'          => qr/hailstone size 1\.75/, # inches

    # 12.7.1(o) codes VIRGA direction, but I have no idea what it means

    'CIG 005V010' => qr/variable ceiling between 500.*?1000/;
    'FG SCT000'   => qr/scattered layer of fog at ground level/;
    'FU BKN020'   => qr/broken layer of smoke at 2000/; # feet

    'BKN014 V OVC' => qr/cloud layer at 1400.*?varies to overcast/;
    'SCT V BKN'    => qr/scattered cloud layer varies to broken/;

    # stopping before 12.7.1(s) ... pick it up in remarks_3 — I wanna code some of this stuff
);

my $decode  = t::test_metar::process_metar(keys %metar);

plan tests => (keys %metar) + 0;

for( keys %metar ) {
    warn " $_ was undefined\n" unless defined $decode->{$_};
    ok( $decode->{$_}, $metar{$_} )
}
