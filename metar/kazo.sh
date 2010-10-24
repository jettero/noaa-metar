set -x

while [ true ]; do
    wget -O kazo.`date +%s` http://weather.noaa.gov/cgi-bin/mgetmetar.pl?cccc=KAZO;
    sleep 25000;
done
