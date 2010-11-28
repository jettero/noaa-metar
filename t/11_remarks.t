
use common::sense;
use Test;
use Tie::IxHash;
use t::test_metar;

tie my %metar, 'Tie::IxHash', (
    '150053Z'   => qr/(2010.*14|14.*2010)/, # this is hard to test since it varies from locale to locale

    RMK  => qr/remarks/,

    'CIG 005V010' => qr/ceiling varies between 500.*?1000/,
    'FG SCT000'   => qr/fog covering 3.*?4.*?at ground level/, # 3/8-4/8
    'FU BKN020'   => qr/smoke covering 5.*?7.*?at 2000/, # 5/8-7/8 coverage at 2000 feet

    'BKN014 V OVC' => qr/broken cloud layer at 1400.*?varies to.*?overcast/,
    'SCT V BKN'    => qr/scattered cloud layer varies to.*?broken/,
);

my $decode  = t::test_metar::process_metar(keys %metar);
plan tests => (keys %metar) + 1;

for( keys %metar ) {
    warn " $_ was undefined\n" unless defined $decode->{$_};
    ok( $decode->{$_}, $metar{$_} )
}

ok( $decode->{other}, undef );
