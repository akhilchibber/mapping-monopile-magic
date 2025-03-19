
import maplibregl from 'maplibre-gl';
import type { Monopile } from './dataUtils';

export interface MapStyle {
  color: string;
  width: number;
  opacity: number;
}

export interface MonopileStyle {
  color: string;
  size: number;
  borderColor: string;
  borderWidth: number;
}

/**
 * Creates and initializes a MapLibre map
 */
export const createMap = (container: HTMLElement): maplibregl.Map => {
  return new maplibregl.Map({
    container,
    style: 'https://demotiles.maplibre.org/style.json',
    center: [0, 20],
    zoom: 2,
    minZoom: 1,
    attributionControl: true,
  });
};

/**
 * Adds GeoJSON data to the map
 */
export const addGeoJsonLayer = (
  map: maplibregl.Map,
  geojson: GeoJSON.FeatureCollection,
  style: MapStyle
): void => {
  // First remove existing layers if they exist
  if (map.getSource('geojson-data')) {
    map.removeLayer('geojson-fill-layer');
    map.removeLayer('geojson-line-layer');
    map.removeSource('geojson-data');
  }

  map.addSource('geojson-data', {
    type: 'geojson',
    data: geojson
  });

  // Add a fill layer
  map.addLayer({
    id: 'geojson-fill-layer',
    type: 'fill',
    source: 'geojson-data',
    paint: {
      'fill-color': style.color,
      'fill-opacity': style.opacity * 0.5 // Less opacity for fill
    },
    filter: ['==', '$type', 'Polygon']
  });

  // Add a line layer
  map.addLayer({
    id: 'geojson-line-layer',
    type: 'line',
    source: 'geojson-data',
    paint: {
      'line-color': style.color,
      'line-width': style.width,
      'line-opacity': style.opacity
    }
  });

  // Fit bounds to the GeoJSON data with padding
  try {
    const bounds = new maplibregl.LngLatBounds();
    geojson.features.forEach(feature => {
      if (feature.geometry.type === 'Point') {
        const coordinates = feature.geometry.coordinates as [number, number];
        bounds.extend(coordinates);
      } else if (feature.geometry.type === 'Polygon') {
        const coordinates = feature.geometry.coordinates[0] as [number, number][];
        coordinates.forEach(coord => bounds.extend(coord));
      } else if (feature.geometry.type === 'LineString') {
        const coordinates = feature.geometry.coordinates as [number, number][];
        coordinates.forEach(coord => bounds.extend(coord));
      }
    });
    
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 50 });
    }
  } catch (error) {
    console.error('Error fitting bounds:', error);
  }
};

/**
 * Updates the style of the GeoJSON layers
 */
export const updateGeoJsonStyle = (
  map: maplibregl.Map,
  style: MapStyle
): void => {
  if (!map.getSource('geojson-data')) return;

  map.setPaintProperty('geojson-fill-layer', 'fill-color', style.color);
  map.setPaintProperty('geojson-fill-layer', 'fill-opacity', style.opacity * 0.5);
  map.setPaintProperty('geojson-line-layer', 'line-color', style.color);
  map.setPaintProperty('geojson-line-layer', 'line-width', style.width);
  map.setPaintProperty('geojson-line-layer', 'line-opacity', style.opacity);
};

/**
 * Adds monopile points to the map
 */
export const addMonopiles = (
  map: maplibregl.Map,
  monopiles: Monopile[],
  idColumnKey: string,
  style: MonopileStyle
): void => {
  // First remove existing monopile layers if they exist
  if (map.getSource('monopile-data')) {
    map.removeLayer('monopile-layer');
    map.removeSource('monopile-data');
  }

  // Convert monopiles to GeoJSON
  const features = monopiles
    .filter(m => m.lat && m.lng) // Only include monopiles with coordinates
    .map(monopile => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [monopile.lng, monopile.lat]
      },
      properties: {
        id: monopile[idColumnKey],
        ...monopile
      }
    }));

  const geojson = {
    type: 'FeatureCollection',
    features
  } as GeoJSON.FeatureCollection;

  map.addSource('monopile-data', {
    type: 'geojson',
    data: geojson
  });

  map.addLayer({
    id: 'monopile-layer',
    type: 'circle',
    source: 'monopile-data',
    paint: {
      'circle-color': style.color,
      'circle-radius': style.size,
      'circle-stroke-color': style.borderColor,
      'circle-stroke-width': style.borderWidth
    }
  });

  // If we have monopiles with coordinates, fit bounds to show them all
  if (features.length > 0) {
    const bounds = new maplibregl.LngLatBounds();
    features.forEach(feature => {
      bounds.extend(feature.geometry.coordinates as [number, number]);
    });
    map.fitBounds(bounds, { padding: 50 });
  }
};

/**
 * Updates the style of monopile points
 */
export const updateMonopileStyle = (
  map: maplibregl.Map,
  style: MonopileStyle
): void => {
  if (!map.getSource('monopile-data')) return;

  map.setPaintProperty('monopile-layer', 'circle-color', style.color);
  map.setPaintProperty('monopile-layer', 'circle-radius', style.size);
  map.setPaintProperty('monopile-layer', 'circle-stroke-color', style.borderColor);
  map.setPaintProperty('monopile-layer', 'circle-stroke-width', style.borderWidth);
};

/**
 * Filters monopiles on the map based on IDs
 */
export const filterMonopilesByIds = (
  map: maplibregl.Map,
  ids: string[],
  idColumnKey: string
): void => {
  if (!map.getSource('monopile-data')) return;

  if (ids.length === 0) {
    // Show all monopiles
    map.setFilter('monopile-layer', null);
  } else {
    // Filter to only show monopiles with matching IDs
    map.setFilter('monopile-layer', ['in', ['get', idColumnKey], ['literal', ids]]);
  }
};

/**
 * Creates a GeoJSON from monopile data
 */
export const createGeoJsonFromMonopiles = (
  monopiles: Monopile[],
  idColumnKey: string
): GeoJSON.FeatureCollection => {
  const features = monopiles
    .filter(m => m.lat && m.lng)
    .map(monopile => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [monopile.lng, monopile.lat]
      },
      properties: {
        id: monopile[idColumnKey],
        ...monopile
      }
    }));

  return {
    type: 'FeatureCollection',
    features
  } as GeoJSON.FeatureCollection;
};

/**
 * Extracts monopile data from GeoJSON points
 */
export const extractMonopilesFromGeoJson = (
  geojson: GeoJSON.FeatureCollection,
  idColumnKey: string
): Monopile[] => {
  return geojson.features
    .filter(feature => feature.geometry.type === 'Point')
    .map(feature => {
      const coordinates = feature.geometry.coordinates as [number, number];
      return {
        id: feature.properties?.[idColumnKey] || 'unknown',
        ...feature.properties,
        lat: coordinates[1],
        lng: coordinates[0]
      };
    });
};
