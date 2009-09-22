
CFLAGS=`pkg-config glib-2.0 --cflags` `pkg-config gdk-2.0 --cflags`
LFLAGS=`pkg-config glib-2.0 --libs`

default: gweather.o

%.o: %.c
	$(CC) $(CFLAGS) -o $@ -c $<
