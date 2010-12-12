    
my @metar = qw(121551Z 35026G33KT 1 1/2SM -SN BLSN BR BKN018 BKN023 M03/M06
    A2957 RMK AO2 PK WND 34040/1541 TWR VIS 3 SLP021 VIS S-W 6 P0001 T10281056);

use common::sense;
use Test;
use Tie::IxHash;
use t::test_metar;

alarm 30;
$SIG{ALRM} = sub { die "timeout while trying to test METAR" };

tie my %metar, 'Tie::IxHash', ( map {$_ => qr(.)} @metar);

my $decode  = t::test_metar::process_metar(keys %metar);
plan tests => (keys %metar) + 1;

for( keys %metar ) {
    warn " $_ was undefined\n" unless defined $decode->{$_};
    ok( $decode->{$_}, $metar{$_} )
}

ok( $decode->{other}, undef );
