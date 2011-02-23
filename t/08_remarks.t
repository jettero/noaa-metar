
use common::sense;
use Test;
use Tie::IxHash;
use t::test_metar;

tie my %metar, 'Tie::IxHash', (
    '150053Z'   => qr/(20\d{2}.*14|14.*20\d{2})/, # this is hard to test since it varies from locale to locale

    RMK  => qr/remarks/,

    'PK WND 28045/15'    => qr/peak wind was 45 knots at 280.*?\d:15/, # the hour depends on the locale, any digit will do
    'PK WND 28045/1715'  => qr/peak wind was 45 knots at 280.*?\d:15/, # the hour depends on the locale, any digit will do
    'PK WND 280453/1715' => qr/peak wind was 45.3 knots at 280.*?\d:15/, # the hour depends on the locale, any digit will do
    'WSHFT 30 FROPA'     => qr/wind shift due to frontal passage.*?\d:30/,
    'WSHFT 1930 FROPA'   => qr/wind shift due to frontal passage.*?\d:30/,
    'WSHFT 19'           => qr/wind shift.*?\d:19/,
);

my $decode  = t::test_metar::process_metar(keys %metar);
plan tests => (keys %metar) + 1;

for( keys %metar ) {
    warn " $_ was undefined\n" unless defined $decode->{$_};
    ok( $decode->{$_}, $metar{$_} )
}

ok( $decode->{other}, undef );
