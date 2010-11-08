
use common::sense;
use Test;
use IPC::System::Simple qw(capturex);
use t::test_metar;
use Data::Dump qw(dump);

my $fname = $0; $fname =~ s/\.t$//; $fname =~ s/-(\d+)$/\/$1Z.metar/; $fname =~ s/^t\//metar\//;
my @METAR = map {[m/(\S+)\s+(.+)/]} grep {m/^K/} capturex(bzcat => $fname);

plan tests => scalar @METAR;

for (@METAR) {
    my ($airport, $metar) = @$_;
    my $decode = t::test_metar::process_metar($metar);

    my $unknown = grep {$_ eq "unknown"} values %$decode;

    if( $unknown == 0 ) {
        ok(1);

    } else {
        open my $fh, ">>", "problem_metar.log" or die $!;
        print $fh "@$_\n", dump($decode), "\n\n";
        ok(0);
    }
}
