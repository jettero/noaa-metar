
CFLAGS=`pkg-config glib-2.0 --cflags` `pkg-config gdk-2.0 --cflags`
LFLAGS=`pkg-config glib-2.0 --libs`

default: gweather

gweather: gweather.o
	$(CC) -o $@ $< -lgweather

%.o: %.c
	$(CC) $(CFLAGS) -o $@ -c $<
