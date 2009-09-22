
#include <stdio.h>
#include <glib-2.0/glib/gtypes> // XXX: this is fairly *NOT PORTABLE*
#include <weather.h>

#ifndef GWEATHER_I_KNOW_THIS_IS_UNSTABLE

void got_weather_cb(WeatherInfo *info, gpointer data) {
}

int main() {
    WeatherLocation *location;
    WeatherPrefs *prefs;
    gpointer data;

    const gchar trans_name   = "Kalamazoo"; // <_name>
    const gchar code         = "KAZO"; // <code>
    const gchar zone         = "MIZ072"; // <zone>
    const gchar radar        = "mkg"; // <radar>
    const gchar coordinates  = "42-13-45N 085-32-47W"; // <coordinates>
    const gchar country_code = "US"; // <iso-code> from <country>
    const gchar tz_hint      = "America/New_York"; // <tz-hint> from <state>

    location = weather_location_new(trans_name, code, zone, radar, coordinates, country_code, tz_hint);
    weather_info_new(location, prefs, got_weather_cb, data);
}
