/* eslint-disable */

export const displayMap = locations => {
  mapboxgl.accessToken = 'pk.eyJ1IjoiZGFhdm8iLCJhIjoiY2wzMHlqNm5tMGsxZjNkbW93ZTRzZ2I0bSJ9.wOOQhLOMRwulyYstalAgjQ';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/daavo/cl30ympdm001p14mucgnetsv2',
    scrollZoom: false
    // center: [-118.113491, 34.111745],
    // zoom: 5,
    // interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add new marker inside mapbox
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Adding popup to display locations
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extending the map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  // Map fitting the bounds
  map.fitBounds(bounds, {
    // Adding padding to maps
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
