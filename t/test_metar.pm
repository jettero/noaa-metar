package t::test_metar;

use common::sense;
use IPC::System::Simple qw(capturex);

my $js = __FILE__;
   $js =~ s/\.pm$/.js/;

sub process_metar {
    my @lines = capturex(node=>$js, "@_");
    chomp @lines;

    my %H;

    $H{$_->[0]} = $_->[1] for map {[ m/^([^:]+):\s+(.+)/ ]} @lines;

    return \%H;
}
