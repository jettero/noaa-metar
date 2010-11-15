package t::test_metar;

use common::sense;
use Tie::IxHash;
use WWW::Mechanize;
use Time::HiRes qw(sleep);
use IO::Socket::INET;
use CGI qw(escape);

my $js = __FILE__;
   $js =~ s/\.pm$/.js/;

my $mech = WWW::Mechanize->new;
my $kpid;

END { kill 15, $kpid if $kpid }
BEGIN {
    my $ppid = $$;

    while( system(qw(fuser -s -k -n tcp 8152))==0 ) {
        sleep 0.1;
    }

    if( $kpid = fork ) {
        # no comment
        my $sock;
        while( !($sock = IO::Socket::INET->new("localhost:8152")) ) {
            sleep 0.1;
        }
        close $sock;

    } elsif( not defined $kpid ) {
        die "fork() failed: $!";

    } else {
        exec node => "t/MQS.js";
        kill 15, $ppid;
        die "exec() failed: $!";
    }
}

sub process_metar {
    $mech->get("http://localhost:8152/?m=" . escape("@_"));
    my @lines = split m/[\r\n]+/m, $mech->content;

    s/[\r\n]+$//g for @lines;
    s/<[^>]+>//g  for @lines;

    tie my %H, 'Tie::IxHash' or die $!;

    $H{$_->[0]} = $_->[1] for map {[ m/^([^:]+):\s+(.+)/ ]} @lines;

    return \%H;
}

1;
