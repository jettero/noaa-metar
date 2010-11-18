
use common::sense;
use Test;
use Tie::IxHash;
use t::test_metar;

tie my %metar, 'Tie::IxHash', (
    RMK  => qr/remarks/,

    '11106'      => qr/6-hour maximum temperature is -10.6/,
    '21150'      => qr/6-hour minimum temperature is -15/,

    '30101'      => qr/3-hour precipitation amount is 1.01 in/,
    '3////'      => qr/3-hour precipitation amount is unknown/,

    '51021'      => qr/3-hour pressure tendency is increasing.*2.1 hPa/,

    '60101'      => qr/6-hour precipitation amount is 1.01 in/,
    '6////'      => qr/6-hour precipitation amount is unknown/,

    '70101'      => qr/24-hour precipitation amount is 1.01 in/,
    '7////'      => qr/24-hour precipitation amount is unknown/,

    '4/004'      => qr/ground accumulation of snow is 4/,
    '933004'     => qr/ground accumulation of snow is 0.4/,

    T11441161    => qr/hourly temperature is -14.4.*hourly dewpoint is -16.1/,

    '8/001'  => "",
    '8/07/'  => "",
    '8/5//'  => "",
);

my $decode  = t::test_metar::process_metar(keys %metar);

plan tests => (keys %metar) + 0;

for( keys %metar ) {
    warn " $_ was undefined\n" unless defined $decode->{$_};
    ok( $decode->{$_}, $metar{$_} )
}
