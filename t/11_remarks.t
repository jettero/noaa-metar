
use common::sense;
use Test;
use Tie::IxHash;
use t::test_metar;

tie my %metar, 'Tie::IxHash', (
    '150053Z'   => qr/(2010.*14|14.*2010)/, # this is hard to test since it varies from locale to locale

    RMK  => qr/remarks/,

    'CIG 005V010' => qr/variable ceiling between 500.*?1000/,
    'FG SCT000'   => qr/scattered layer of fog at ground level/,
    'FU BKN020'   => qr/broken layer of smoke at 2000/, # feet

    'BKN014 V OVC' => qr/cloud layer at 1400.*?varies to overcast/,
    'SCT V BKN'    => qr/scattered cloud layer varies to broken/,
);

my $decode  = t::test_metar::process_metar(keys %metar);

plan tests => (keys %metar) + 0;

for( keys %metar ) {
    warn " $_ was undefined\n" unless defined $decode->{$_};
    ok( $decode->{$_}, $metar{$_} )
}
