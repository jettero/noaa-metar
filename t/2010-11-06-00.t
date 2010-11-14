
use common::sense;
use Test;
use IPC::System::Simple qw(capturex);
use t::test_metar;

my $fname = $0; $fname =~ s/\.t$//; $fname =~ s/-(\d+)$/\/$1Z.metar/; $fname =~ s/^t\//metar\//;
my @METAR = map {[m/(\S+)\s+(.+)/]} grep {chomp; m/^K/ and not m/[^[:print:]]/} capturex(bzcat => $fname);

my %undocumented_bs = (
    120      => 1,
    BLO      => 1,
    12       => 1,
    11       => 1,
    15       => 1,
    '007'    => 1,
    A98      => 1, # this is probably meant to be A2980? whatever... looks hand typed
    BKN      => 1, # with no height, what do they hope this means?
    OVC      => 1, # with no height, what do they hope this means?
    SCT      => 1, # with no height, what do they hope this means?
    OV       => 1,
    SCRT010  => 1, # they mean SCT ... pfft
    MMMMMKT  => 1,
    VRB043T  => 'VRB043KT',
    '28004T' => '28004KT',
    -VCTSDZ  => 1, # this is illegal, you can't mix vc with -
    BKN200EH => 1,
    BRFT     => 1, # wtf is FT supposed to be?

    FEW001BKN002 => 1, # needs space — if this later turns out to be pretty common, I could code for it.
    FEW001OVC002 => 1, # ""

    -PL => 1, # spray? dust? ice?

    '060456ZUTO/1009KT' => 1, # there's something wrong with the upload on KNLC I think
);

my %fixes = (
   '\b1OSM\b'        => "10SM", # heh, old people
   '\bNO SPECI\b'    => 'RMK NO SPECI',  # I believe the 11/6 14 report from KTRK to be remarks that there is no speci
   '\b7 SKC\b'       => '',
   '\b04/KM07\b'     => '04/M07',
   '\bSKCSM\b'       => '',
    A3000PMK         => "A3000 RMK",
   'SCT180 B20'      => "SCT180 BKN020",
   '10 1I06/02'      => 'COR',     # whatever, it's clearly just a transmission error anyway
   '\bK AO2'         => "RMK AO2", # KNLC is borked
   'A29O\b'          => "A2900",   # that's not A290, btw, it's A29O
   '\b30008K\b'      => "30008KT",
   '\b220M07\b'      => '22/M07',
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
        print $fh __FILE__, "\n@$_\n";

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
