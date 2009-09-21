default: test

test: clean build
	palm-install *.ipk
	/usr/local/bin/novacom/novacom -t open tty://; echo; echo

myinstall: clean build
	scp *.ipk castle.vhb:
	ssh castle.vhb

build: locations.js
	ln -sf ./ GWeather && \
        palm-package --exclude *.tar.gz --exclude .git --exclude cgi --exclude "*.ipk" --exclude GWeather --exclude contrib --exclude Makefile \
            GWeather && rm GWeather

locations.js: contrib/process_locations.pl contrib/Locations.xml
	./contrib/process_locations.pl

clean:
	git clean -dfx
