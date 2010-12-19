name=NOAA-METAR
ssh=ssh -p 2222 -l root localhost

default: test

buildliterelease litereleasebuild:
	+ env -i make --no-print-directory buildlite

buildrelease releasebuild:
	+ env -i make --no-print-directory build

release: releasebuild clean
	git fetch github gh-pages:gh-pages
	x=$$(ls -1 *.ipk); mv -v $$x /tmp; git checkout gh-pages; mv -v /tmp/$$x .; git add *.ipk; git clean -dfx

testlite:
	+ NM_LITE=1 make --no-print-directory test

test:
	+ NM_LOGLEVEL=99 make --no-print-directory build
	palm-install -d emulator *.ipk
	if [ -n "$$NM_LITE" ]; then \
        $(ssh) luna-send -n 1 palm://com.palm.applicationManager/launch "'{\"id\":\"org.voltar.metar-lite\"}'"; \
    else \
        $(ssh) luna-send -n 1 palm://com.palm.applicationManager/launch "'{\"id\":\"org.voltar.noaa-metar\"}'"; \
    fi
	$(ssh) tail -n 100 -f /var/log/messages | ./log-parse.pl -ca

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

buildlite:
	+ NM_LITE=1 make --no-print-directory build

build: sources.json locations.js build_date app/assistants/TAF.js app/views/TAF.html framework_config.json runtime_options.json appinfo.json
	@-rm -vf *.ipk $(name) *.tar.gz ipkgtmp*
	ln -sf ./ $(name) && \
        palm-package --exclude "*.tar.gz" --exclude .git --exclude cgi --exclude "*.ipk" \
                     --exclude $(name) --exclude contrib --exclude Makefile \
                     --exclude log-parse.pl --exclude do-metar.pl \
                     --exclude framework_config.json.in --exclude runtime_options.json.in \
                     --exclude meta --exclude metar \
                     --exclude prove --exclude t-real-metar --exclude t \
          $$([ -n "$$NM_LITE" ] && echo --exclude metar.js --exclude locations.js ) \
          $$([ -n "$$NM_LITE" ] && echo --exclude app/views/METARDecoder.html --exclude app/views/TAFDecoder.html ) \
          $$([ -n "$$NM_LITE" ] && echo --exclude app/assistants/METARDecoder.js --exclude app/assistants/TAFDecoder.js ) \
        $(name) && rm $(name)

contrib/locations-K.html:
	wget -O $@ http://en.wikipedia.org/wiki/List_of_airports_by_ICAO_code:_K
	git add $@

contrib/locations-P.html:
	wget -O $@ http://en.wikipedia.org/wiki/List_of_airports_by_ICAO_code:_P
	git add $@

locations.js: contrib/process_locations.pl contrib/locations-K.html contrib/locations-P.html
	./contrib/process_locations.pl

newenvvars:
	@ if [ -f envvars ]; then \
        set | grep ^NM_ | sort > $@; \
        m1=$$(md5sum $@ | awk '{print $$1}'); m2=$$(md5sum envvars | awk '{print $$1}'); \
        if [ "$$m1" = "$$m2" ]; then rm $@; else mv $@ envvars; fi \
	fi

envvars:
	@ set | grep ^NM_ | sort > $@


sources.json: sources.json.in sources-lite.json.in newenvvars envvars
	@ if [ -n "$$NM_LITE" ]; then cp -va sources-lite.json.in $@; else cp -va sources.json.in $@; fi

appinfo.json: appinfo.json.in newenvvars envvars
	@ if [ -n "$$NM_LITE" ]; then sed -e s/noaa-metar/metar-lite/ -e 's/NOAA METAR/METAR Lite/' < $< > $@; echo made $@; \
        else cp -va $< $@; fi

%.json: %.json.in newenvvars envvars
	@echo build $@
	@./JSON_preparser.pl $< > $@

# ssed is "super sed", not a typo. It's a debian thing and gives us the -R mode.
metartaf_subst = ssed -R -e 's/METAR(?!.*skip MTS)/TAF/g' -e 's/metar(?!.*skip MTS)/taf/g'

app/views/TAF.html: app/views/METAR.html Makefile
	@ $(metartaf_subst) < $< > $@

app/assistants/TAF.js: app/assistants/METAR.js Makefile
	@ $(metartaf_subst) < $< > $@

clean:
	git clean -dfx
