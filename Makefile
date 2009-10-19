default: test

test: build
	palm-install *.ipk
	/usr/local/bin/novacom/novacom -t open tty://; echo; echo

myinstall: clean build
	scp *.ipk castle.vhb:
	ssh castle.vhb

build: locations.js
	@-rm -vf *.ipk NOAA-METAR *.tar.gz ipkgtmp*
	ln -sf ./ NOAA-METAR && \
        palm-package --exclude "*.tar.gz" --exclude .git --exclude cgi --exclude "*.ipk" --exclude NOAA-METAR --exclude contrib --exclude Makefile \
            NOAA-METAR && rm NOAA-METAR

contrib/locations.html:
	wget -O contrib/locations.html http://en.wikipedia.org/wiki/List_of_airports_by_ICAO_code:_K
	git add contrib/locations.html

locations.js: contrib/process_locations.pl contrib/locations.html
	./contrib/process_locations.pl

clean:
	git clean -dfx
