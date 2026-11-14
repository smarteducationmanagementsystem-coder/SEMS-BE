const { ApiError } = require("../utils/apiError");

const CAMPUS_RADIUS_METERS = 500;

function presentLocation(pin) {
  const latitude = typeof pin?.latitude === "number" ? pin.latitude : null;
  const longitude = typeof pin?.longitude === "number" ? pin.longitude : null;
  return {
    label: pin?.label || "",
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
  };
}

function savedPins(institution) {
  return [institution.location1, institution.location2]
    .map(presentLocation)
    .filter((pin) => pin.latitude !== null && pin.longitude !== null);
}

function distanceMeters(fromLat, fromLng, toLat, toLng) {
  const earth = 6371000;
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeShift = radians(toLat - fromLat);
  const longitudeShift = radians(toLng - fromLng);
  const start = radians(fromLat);
  const end = radians(toLat);
  const chord = Math.sin(latitudeShift / 2) ** 2 + Math.cos(start) * Math.cos(end) * Math.sin(longitudeShift / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(chord)));
}

function assertCampusLocation(institution, input) {
  if (!institution.locationCheckEnabled) return;
  const pins = savedPins(institution);
  if (pins.length === 0) throw new ApiError(403, "Reach your location to login your portal.");
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new ApiError(403, "Enable location to login your portal.");
  }
  const inside = pins.some((pin) => distanceMeters(latitude, longitude, pin.latitude, pin.longitude) <= CAMPUS_RADIUS_METERS);
  if (!inside) throw new ApiError(403, "Reach your location to login your portal.");
}

module.exports = { presentLocation, assertCampusLocation };
