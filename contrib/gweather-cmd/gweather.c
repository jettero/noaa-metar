
#define GWEATHER_I_KNOW_THIS_IS_UNSTABLE

#include <stdio.h>
#include <libgweather/weather.h>

void got_weather_cb(WeatherInfo *info, gpointer data) {
}

int main() {
    WeatherLocation *location;
    WeatherPrefs prefs;
    gpointer data;

    const gchar * trans_name   = "Kalamazoo"; // <_name>
    const gchar * code         = "KAZO"; // <code>
    const gchar * zone         = "MIZ072"; // <zone>
    const gchar * radar        = "mkg"; // <radar>
    const gchar * coordinates  = "42-13-45N 085-32-47W"; // <coordinates>
    const gchar * country_code = "US"; // <iso-code> from <country>
    const gchar * tz_hint      = "America/New_York"; // <tz-hint> from <state>

    // TODO: this needs to be freed I bet, dunno for sure
    location = weather_location_new(trans_name, code, zone, radar, coordinates, country_code, tz_hint);

    prefs.type             = FORECAST_ZONE; // ZONE or STATE. ??
    prefs.radar            = 1;
    prefs.temperature_unit = TEMP_UNIT_FAHRENHEIT;
    prefs.speed_unit       = SPEED_UNIT_MPH;
    prefs.pressure_unit    = PRESSURE_UNIT_ATM;
    prefs.distance_unit    = DISTANCE_UNIT_MILES;

    weather_info_new(location, &prefs, got_weather_cb, data);
}
