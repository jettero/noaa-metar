package t::test_metar;
use Encode;

use common::sense;
use IPC::System::Simple qw(capturex);
use Tie::IxHash;

my $js = __FILE__;
   $js =~ s/\.pm$/.js/;

sub process_metar {
    my @lines = capturex(node=>$js, "@_");
    chomp @lines;

    s/<[^>]+>//g for @lines;

    tie my %H, 'Tie::IxHash' or die $!;

    $H{$_->[0]} = decode(utf8=>$_->[1]) for map {[ m/^([^:]+):\s+(.+)/ ]} @lines;

    return \%H;
}
