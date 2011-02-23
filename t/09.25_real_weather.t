

use common::sense;
use Test;
use Tie::IxHash;
use t::test_metar;

plan tests => 4;

my $decode  = t::test_metar::process_metar("210404Z RMK UPB0356E0359FZRAE0356B0359");

# use Data::Dump qw(dump);
# die dump($decode);

ok( $decode->{'210404Z'} );
ok( $decode->{RMK}, qr(remarks) );
ok( $decode->{FZRAE0356B0359}, qr(unknown.*began.*ended) );
ok( $decode->{UPB0356E0359},   qr(freezing rain.*began.*ended) );
