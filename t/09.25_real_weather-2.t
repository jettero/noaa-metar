

use common::sense;
use Test;
use Tie::IxHash;
use t::test_metar;

plan tests => 2;

my $decode  = t::test_metar::process_metar("230230Z 04004KT 010V070 9999 FEW018 M15/M17 Q1026 R33/1///40 NOSIG");

skip("I literally can't find this in the WMO manual; eu METAR sucks", 1,1,1);
# ok( $decode->{'R33/1///40'}, qr(wtf I don't even) );
ok( $decode->{NOSIG}, qr(no sig) );
