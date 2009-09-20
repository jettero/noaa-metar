default: test

test: clean build
	palm-install *.ipk
	/usr/local/bin/novacom/novacom -t open tty://; echo; echo

myinstall: clean build
	scp *.ipk castle.vhb:
	ssh castle.vhb

build:
	ln -sf ./ Hiveminder && \
        palm-package --exclude="*.ipk" --exclude Hiveminder --exclude=Makefile Hiveminder && \
        rm Hiveminder

clean:
	git clean -dfx
