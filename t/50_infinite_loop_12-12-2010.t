    
my @metar = qw(121551Z 35026G33KT 1 1/2SM -SN BLSN BR BKN018 BKN023 M03/M06
    A2957 RMK AO2 PK WND 34040/1541 TWR VIS 3 SLP021 VIS S-W 6 P0001 T10281056);

use common::sense;
use Test;
use t::test_metar;

plan tests => 1;

alarm 30;
$SIG{ALRM} = sub { ok(0); exit 0 };

my $decode  = t::test_metar::process_metar(@metar);

ok( $decode->{-SN}, qr/light snow/ );
