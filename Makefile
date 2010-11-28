name=NOAA-METAR
ssh=ssh -p 2222 -l root localhost

default: test

release: clean
	env -i make --no-print-directory build
	git fetch github gh-pages:gh-pages
	x=$$(ls -1 *.ipk); mv -v $$x /tmp; git checkout gh-pages; mv -v /tmp/$$x .; git add *.ipk; git clean -dfx

test:
	@+ make --no-print-directory build
	palm-install -d emulator *.ipk
	$(ssh) luna-send -n 1 palm://com.palm.applicationManager/launch "'{\"id\":\"org.voltar.noaa-metar\"}'"
	$(ssh) tail -n 1000 -f /var/log/messages | ./log-parse.pl

lc logcontinue cl continuelog:
	$(ssh) tail -n 0 -f /var/log/messages | ./log-parse.pl -ca

flc freshlogcontinue:
	cat /dev/null > last_run.log
	@+ make --no-print-directory lc

myinstall: clean
	@+ make --no-print-directory build
	scp *.ipk $${INSTHOST:-castle.vhb}:
	ssh $${INSTHOST:-castle.vhb} /usr/bin/ipkg -o /media/cryptofs/apps install *.ipk

build_date:
	@ echo "\"$$(date)\"" > build_date.json

build: locations.js README build_date
	@-rm -vf *.ipk $(name) *.tar.gz ipkgtmp*
	ln -sf ./ $(name) && \
        palm-package --exclude "*.tar.gz" --exclude .git --exclude cgi --exclude "*.ipk" \
                     --exclude $(name) --exclude contrib --exclude Makefile \
                     --exclude log-parse.pl --exclude do-metar.pl \
                     --exclude meta --exclude metar \
                     --exclude prove --exclude t-real-metar --exclude t \
        $(name) && rm $(name)

contrib/locations.html:
	wget -O contrib/locations.html http://en.wikipedia.org/wiki/List_of_airports_by_ICAO_code:_K
	git add contrib/locations.html

locations.js: contrib/process_locations.pl contrib/locations.html
	./contrib/process_locations.pl

README: app/views/About.html app/views/Help.html Makefile
	@ echo -----=: app/views/About.html  > README
	@ elinks -dump app/views/About.html >> README
	@ echo                              >> README
	@ echo -----=: app/views/Help.html  >> README
	@ elinks -dump app/views/Help.html  >> README
	@ (git add README && git commit -m "updated README" README; exit 0)

clean:
	git clean -dfx
