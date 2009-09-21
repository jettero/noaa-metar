default: test

test: clean build
	palm-install *.ipk
	/usr/local/bin/novacom/novacom -t open tty://; echo; echo

myinstall: clean build
	scp *.ipk castle.vhb:
	ssh castle.vhb

build: locations.js
	ln -sf ./ GWeather && \
        palm-package --exclude=.git --exclude=cgi --exclude="*.ipk" --exclude=GWeather --exclude=Makefile \
            --exclude=img --exclude=Locations.xml \
            GWeather && rm GWeather

locations.js: process_locations.pl Locations.xml
	./process_locations.pl

clean:
	git clean -dfx
