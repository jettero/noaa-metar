
CFLAGS=`pkg-config glib-2.0 --cflags` `pkg-config gdk-2.0 --cflags`
LFLAGS=`pkg-config glib-2.0 --libs`

default: gweather
	./gweather 2>error.log || (echo; echo ERRORS:; head -n 45 error.log)

gweather: gweather.o
	$(CC) -o $@ $< -lgweather

%.o: %.c
	$(CC) $(CFLAGS) -o $@ -c $<
