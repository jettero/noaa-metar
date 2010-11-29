
use common::sense;
use Test;
use Tie::IxHash;
use t::test_metar;

tie my %metar, 'Tie::IxHash', (
    '150053Z'   => qr/(2010.*14|14.*2010)/, # this is hard to test since it varies from locale to locale

    RMK  => qr/remarks/,

    PRESRR => qr/pressure rising rapidly/,
    PRESFR => qr/pressure falling rapidly/,

    'ACFT MSHP' => qr/aircraft mishap/,

    'SNINCR 2/10' => qr/snow increasing rapidly.*?2.*?last hou.*?10.*?on ground/, # 2in in last hour, 10in total depth
);

my $decode  = t::test_metar::process_metar(keys %metar);
plan tests => (keys %metar) + 1;

for( keys %metar ) {
    warn " $_ was undefined\n" unless defined $decode->{$_};
    ok( $decode->{$_}, $metar{$_} )
}

ok( $decode->{other}, undef );
