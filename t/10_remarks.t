
use common::sense;
use Test;
use Tie::IxHash;
use t::test_metar;

tie my %metar, 'Tie::IxHash', (
    '150053Z'   => qr/(2010.*14|14.*2010)/, # this is hard to test since it varies from locale to locale

    RMK  => qr/remarks/,

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
);

my $decode  = t::test_metar::process_metar(keys %metar);
plan tests => (keys %metar) + 1;

for( keys %metar ) {
    warn " $_ was undefined\n" unless defined $decode->{$_};
    ok( $decode->{$_}, $metar{$_} )
}

ok( $decode->{other}, undef );
