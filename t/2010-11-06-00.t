
use common::sense;
use Test;
use IPC::System::Simple qw(capturex);
use t::test_metar;

my $fname = $0; $fname =~ s/\.t$//; $fname =~ s/-(\d+)$/\/$1Z.metar/; $fname =~ s/^t\//metar\//;
my @METAR = map {[m/(\S+)\s+(.+)/]} grep {chomp; m/^K/ and not m/[^[:print:]]/} capturex(bzcat => $fname);

my %undocumented_bs = (
    120 => 1,
    BLO => 1,
    12  => 1,
    A98 => 1, # this is probably meant to be A2980? whatever... looks hand typed
);

my %fixes = (
    A3000PMK    => "A3000 RMK",
   'SCT180 B20' => "SCT180 BKN020",
);

plan tests => scalar @METAR;

for (@METAR) {
    my ($airport, $metar) = @$_;
    $metar =~ s/$_/$fixes{$_}/g for keys %fixes;

    my $decode  = t::test_metar::process_metar($metar);
    my $unknown = grep {$decode->{$_} eq "unknown" and not $undocumented_bs{$_}} keys %$decode;

    if( $unknown == 0 ) {
        ok(1);

    } else {
        open my $fh, ">>:utf8", "problem_metar.log" or die $!;
        print $fh "@$_\n";

        my $keyln = 0;

        for (keys %$decode) {
            $keyln = length if length>$keyln;
        }

        $keyln ++;

        for (keys %$decode ){
            print $fh sprintf('%*s %s', $keyln, $_, $decode->{$_}), "\n";
        }

        print $fh "\n";
        ok(0);
    }
}
