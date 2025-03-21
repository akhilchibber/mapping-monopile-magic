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
    style: {
      version: 8,
      sources: {},
      layers: []
    },
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
    if (map.getLayer('geojson-fill-layer')) {
      map.removeLayer('geojson-fill-layer');
    }
    if (map.getLayer('geojson-line-layer')) {
      map.removeLayer('geojson-line-layer');
    }
    if (map.getLayer('geojson-point-layer')) {
      map.removeLayer('geojson-point-layer');
    }
    map.removeSource('geojson-data');
  }

  map.addSource('geojson-data', {
    type: 'geojson',
    data: geojson
  });

  // Add a fill layer for polygons
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

  // Add a line layer for polylines
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

  // Add a circle layer for points
  map.addLayer({
    id: 'geojson-point-layer',
    type: 'circle',
    source: 'geojson-data',
    paint: {
      'circle-radius': style.width * 2,
      'circle-color': style.color,
      'circle-opacity': style.opacity
    },
    filter: ['==', '$type', 'Point']
  });

  // Fit bounds to the GeoJSON data with padding
  try {
    const bounds = new maplibregl.LngLatBounds();
    let hasValidFeatures = false;

    geojson.features.forEach(feature => {
      if (!feature.geometry) return;
      
      if (feature.geometry.type === 'Point') {
        const pointGeom = feature.geometry as GeoJSON.Point;
        if (pointGeom.coordinates && pointGeom.coordinates.length >= 2) {
          bounds.extend([pointGeom.coordinates[0], pointGeom.coordinates[1]]);
          hasValidFeatures = true;
        }
      } else if (feature.geometry.type === 'Polygon') {
        const polygonGeom = feature.geometry as GeoJSON.Polygon;
        if (polygonGeom.coordinates && polygonGeom.coordinates.length > 0) {
          polygonGeom.coordinates[0].forEach(coord => {
            if (coord && coord.length >= 2) {
              bounds.extend([coord[0], coord[1]]);
              hasValidFeatures = true;
            }
          });
        }
      } else if (feature.geometry.type === 'LineString') {
        const lineGeom = feature.geometry as GeoJSON.LineString;
        if (lineGeom.coordinates) {
          lineGeom.coordinates.forEach(coord => {
            if (coord && coord.length >= 2) {
              bounds.extend([coord[0], coord[1]]);
              hasValidFeatures = true;
            }
          });
        }
      } else if (feature.geometry.type === 'MultiPoint') {
        const multiPointGeom = feature.geometry as GeoJSON.MultiPoint;
        if (multiPointGeom.coordinates) {
          multiPointGeom.coordinates.forEach(coord => {
            if (coord && coord.length >= 2) {
              bounds.extend([coord[0], coord[1]]);
              hasValidFeatures = true;
            }
          });
        }
      } else if (feature.geometry.type === 'MultiLineString') {
        const multiLineGeom = feature.geometry as GeoJSON.MultiLineString;
        if (multiLineGeom.coordinates) {
          multiLineGeom.coordinates.forEach(line => {
            line.forEach(coord => {
              if (coord && coord.length >= 2) {
                bounds.extend([coord[0], coord[1]]);
                hasValidFeatures = true;
              }
            });
          });
        }
      } else if (feature.geometry.type === 'MultiPolygon') {
        const multiPolygonGeom = feature.geometry as GeoJSON.MultiPolygon;
        if (multiPolygonGeom.coordinates) {
          multiPolygonGeom.coordinates.forEach(polygon => {
            polygon[0].forEach(coord => {
              if (coord && coord.length >= 2) {
                bounds.extend([coord[0], coord[1]]);
                hasValidFeatures = true;
              }
            });
          });
        }
      }
    });
    
    if (hasValidFeatures && !bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 50 });
      console.log('Fitted bounds to GeoJSON data');
    } else {
      console.warn('No valid geometries found in GeoJSON');
    }
  } catch (error) {
    console.error('Error fitting bounds:', error);
  }
};

/**
 * Filters GeoJSON features by property values without recentering the map
 */
export const filterGeoJsonByProperty = (
  map: maplibregl.Map,
  propertyKey: string,
  propertyValues: string[]
): void => {
  if (!map.getSource('geojson-data')) return;

  const layers = ['geojson-fill-layer', 'geojson-line-layer', 'geojson-point-layer'];
  
  if (propertyValues.length === 0) {
    // Show all features if no filter values provided
    layers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        if (layerId === 'geojson-point-layer') {
          map.setFilter(layerId, ['==', '$type', 'Point']);
        } else if (layerId === 'geojson-fill-layer') {
          map.setFilter(layerId, ['==', '$type', 'Polygon']);
        } else {
          map.setFilter(layerId, null);
        }
      }
    });
  } else {
    // Apply filter to each layer
    layers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        let baseFilter;
        
        if (layerId === 'geojson-point-layer') {
          baseFilter = ['==', '$type', 'Point'];
        } else if (layerId === 'geojson-fill-layer') {
          baseFilter = ['==', '$type', 'Polygon'];
        } else {
          baseFilter = null;
        }
        
        // Create a filter that combines the base filter with property filter
        const propertyFilter = ['in', ['get', propertyKey], ['literal', propertyValues]];
        
        if (baseFilter) {
          map.setFilter(layerId, ['all', baseFilter, propertyFilter]);
        } else {
          map.setFilter(layerId, propertyFilter);
        }
      }
    });
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
  map.setPaintProperty('geojson-point-layer', 'circle-color', style.color);
  map.setPaintProperty('geojson-point-layer', 'circle-radius', style.width * 2);
  map.setPaintProperty('geojson-point-layer', 'circle-opacity', style.opacity);
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
  const result = geojson.features
    .filter(feature => feature.geometry && feature.geometry.type === 'Point')
    .map(feature => {
      const pointGeom = feature.geometry as GeoJSON.Point;
      if (!pointGeom.coordinates || pointGeom.coordinates.length < 2) {
        throw new Error('Invalid point coordinates in GeoJSON');
      }
      const coordinates = pointGeom.coordinates as [number, number];
      const properties = feature.properties || {};
      
      return {
        id: properties[idColumnKey] || 'unknown',
        ...properties,
        lat: coordinates[1],
        lng: coordinates[0]
      };
    });
    
  console.log(`Extracted ${result.length} monopiles from GeoJSON`);
  return result;
};

/**
 * Available map styles for OpenStreetMap
 */
export const MAP_STYLES = [
  { 
    id: 'osm-standard', 
    name: 'OpenStreetMap Standard', 
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  { 
    id: 'osm-carto', 
    name: 'OSM Carto', 
    url: 'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>'
  },
  { 
    id: 'osm-topo', 
    name: 'OSM Topo', 
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
  },
  { 
    id: 'osm-humanitarian', 
    name: 'OSM Humanitarian', 
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://www.hotosm.org/">Humanitarian OpenStreetMap Team</a>'
  }
];

/**
 * Sets the map's base tile layer
 */
export const setMapStyle = (map: maplibregl.Map, styleId: string): void => {
  const style = MAP_STYLES.find(s => s.id === styleId);
  if (!style) return;
  
  // First remove any existing raster sources and layers
  if (map.getSource('osm-tiles')) {
    map.removeLayer('osm-layer');
    map.removeSource('osm-tiles');
  }

  // Add new raster source
  map.addSource('osm-tiles', {
    type: 'raster',
    tiles: [style.url.replace('{s}', 'a')],
    tileSize: 256,
    attribution: style.attribution
  });

  // Add new raster layer at the bottom of the layer stack
  map.addLayer({
    id: 'osm-layer',
    type: 'raster',
    source: 'osm-tiles',
    minzoom: 0,
    maxzoom: 19
  }, map.getStyle().layers[0]?.id || undefined);
};
