default: test

test: clean build
	palm-install *.ipk
	/usr/local/bin/novacom/novacom -t open tty://; echo; echo

myinstall: clean build
	scp *.ipk castle.vhb:
	ssh castle.vhb

build:
	ln -sf ./ GWeather && \
        palm-package --exclude="*.ipk" --exclude GWeather --exclude=Makefile GWeather && \
        rm GWeather

clean:
	git clean -dfx
