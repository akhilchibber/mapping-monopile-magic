
import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Layers, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import StyleControls from './StyleControls';
import { 
  createMap, 
  addGeoJsonLayer, 
  updateGeoJsonStyle,
  addMonopiles,
  updateMonopileStyle,
  filterMonopilesByIds,
  setMapStyle,
  MAP_STYLES,
  MapStyle,
  MonopileStyle,
  filterGeoJsonByProperty
} from '@/utils/mapUtils';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Monopile } from '@/utils/dataUtils';

interface MapProps {
  geoJsonData: GeoJSON.FeatureCollection | null;
  monopiles: Monopile[];
  tableIdColumn: string | null;
  geoJsonIdColumn: string | null;
  filteredIds: string[];
  hasGeoJson: boolean;
  onMapClick: (lat: number, lng: number) => void;
  selectedMonopileId: string | null;
}

const Map: React.FC<MapProps> = ({
  geoJsonData,
  monopiles,
  tableIdColumn,
  geoJsonIdColumn,
  filteredIds,
  hasGeoJson,
  onMapClick,
  selectedMonopileId,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [showStyleSettings, setShowStyleSettings] = useState(false);
  const [selectedMapStyle, setSelectedMapStyle] = useState('osm-carto');
  
  // Default styles
  const [geoJsonStyle, setGeoJsonStyle] = useState<MapStyle>({
    color: '#3b82f6',
    width: 2,
    opacity: 0.8,
  });
  
  const [monopileStyle, setMonopileStyle] = useState<MonopileStyle>({
    color: '#f97316',
    size: 6,
    borderColor: '#ffffff',
    borderWidth: 1,
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;
    
    const mapInstance = createMap(mapContainer.current);
    map.current = mapInstance;
    
    // Add navigation control
    mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');
    
    mapInstance.on('load', () => {
      // Set initial OpenStreetMap style
      setMapStyle(mapInstance, selectedMapStyle);
      
      // If we already have GeoJSON data, add it to the map
      if (geoJsonData) {
        try {
          addGeoJsonLayer(mapInstance, geoJsonData, geoJsonStyle);
        } catch (error) {
          console.error('Error adding GeoJSON layer on initial load:', error);
          toast.error('Error visualizing GeoJSON data');
        }
      }
      
      // If we already have monopiles with coordinates, add them to the map
      if (monopiles.length > 0 && tableIdColumn && monopiles.some(m => m.lat && m.lng)) {
        try {
          addMonopiles(mapInstance, monopiles, tableIdColumn, monopileStyle);
        } catch (error) {
          console.error('Error adding monopiles on initial load:', error);
        }
      }
      
      toast.success('Map loaded successfully', { id: 'map-loaded' });
    });
    
    // Handle map click for adding monopiles
    mapInstance.on('click', (e) => {
      if (hasGeoJson || !selectedMonopileId) return;
      
      onMapClick(e.lngLat.lat, e.lngLat.lng);
      
      // Add a marker animation
      const marker = document.createElement('div');
      marker.className = 'absolute w-5 h-5 bg-boskalis-orange rounded-full';
      marker.style.left = `${e.point.x - 10}px`;
      marker.style.top = `${e.point.y - 10}px`;
      marker.style.animation = 'ping 1s cubic-bezier(0, 0, 0.2, 1) forwards';
      
      const mapEl = mapContainer.current;
      if (mapEl) {
        mapEl.appendChild(marker);
        setTimeout(() => {
          marker.remove();
        }, 1000);
      }
    });
    
    return () => {
      mapInstance.remove();
    };
  }, [hasGeoJson, onMapClick, selectedMonopileId]);

  // Update map style when changed
  useEffect(() => {
    if (!map.current || !map.current.loaded()) return;
    setMapStyle(map.current, selectedMapStyle);
  }, [selectedMapStyle]);

  // Add GeoJSON data to map
  useEffect(() => {
    if (!map.current || !map.current.loaded() || !geoJsonData) return;
    
    console.log('Adding GeoJSON to map:', geoJsonData);
    
    // Log feature types for debugging
    if (geoJsonData.features.length > 0) {
      const geometryTypes = geoJsonData.features
        .map(f => f.geometry?.type || 'unknown')
        .reduce((acc, type) => {
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      console.log('GeoJSON geometry types:', geometryTypes);
    }
    
    try {
      addGeoJsonLayer(map.current, geoJsonData, geoJsonStyle);
      toast.success('GeoJSON data displayed on map');
    } catch (error) {
      console.error('Error adding GeoJSON layer:', error);
      toast.error('Error displaying GeoJSON data. Please check the file format.');
    }
  }, [geoJsonData, geoJsonStyle]);

  // Add monopiles to map
  useEffect(() => {
    if (!map.current || !map.current.loaded() || !tableIdColumn || monopiles.length === 0) return;
    
    const validMonopiles = monopiles.filter(m => m.lat && m.lng);
    console.log('Adding monopiles to map:', validMonopiles.length);
    
    if (validMonopiles.length > 0) {
      try {
        addMonopiles(map.current, monopiles, tableIdColumn, monopileStyle);
      } catch (error) {
        console.error('Error adding monopiles:', error);
      }
    }
  }, [monopiles, tableIdColumn, monopileStyle]);

  // Filter GeoJSON features by search filter
  useEffect(() => {
    if (!map.current || !map.current.loaded() || !geoJsonData || !geoJsonIdColumn || filteredIds.length === 0) return;
    
    try {
      // Apply filtering to GeoJSON layer without recentering the map
      filterGeoJsonByProperty(map.current, geoJsonIdColumn, filteredIds);
    } catch (error) {
      console.error('Error filtering GeoJSON features:', error);
    }
  }, [filteredIds, geoJsonIdColumn, geoJsonData]);

  // Filter monopiles based on search
  useEffect(() => {
    if (!map.current || !map.current.loaded() || !tableIdColumn || filteredIds.length === 0) return;
    
    try {
      filterMonopilesByIds(map.current, filteredIds, tableIdColumn);
    } catch (error) {
      console.error('Error filtering monopiles:', error);
    }
  }, [filteredIds, tableIdColumn]);

  // Update GeoJSON style when changed
  useEffect(() => {
    if (!map.current || !map.current.loaded() || !geoJsonData) return;
    
    try {
      updateGeoJsonStyle(map.current, geoJsonStyle);
    } catch (error) {
      console.error('Error updating GeoJSON style:', error);
    }
  }, [geoJsonStyle, geoJsonData]);

  // Update monopile style when changed
  useEffect(() => {
    if (!map.current || !map.current.loaded() || monopiles.length === 0) return;
    
    try {
      updateMonopileStyle(map.current, monopileStyle);
    } catch (error) {
      console.error('Error updating monopile style:', error);
    }
  }, [monopileStyle, monopiles]);

  const handleGeoJsonStyleChange = (style: MapStyle) => {
    setGeoJsonStyle(style);
  };

  const handleMonopileStyleChange = (style: MonopileStyle) => {
    setMonopileStyle(style);
  };

  const handleMapStyleChange = (styleId: string) => {
    setSelectedMapStyle(styleId);
  };

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full rounded-lg overflow-hidden" />
      
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Popover open={showStyleSettings} onOpenChange={setShowStyleSettings}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="bg-white shadow-sm hover:bg-white hover:text-boskalis-light-blue"
            >
              <Layers className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Map Style</h3>
                <Select
                  value={selectedMapStyle}
                  onValueChange={handleMapStyleChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a map style" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAP_STYLES.map((style) => (
                      <SelectItem key={style.id} value={style.id}>
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <StyleControls 
                hasGeoJson={!!geoJsonData}
                geoJsonStyle={geoJsonStyle}
                monopileStyle={monopileStyle}
                onGeoJsonStyleChange={handleGeoJsonStyleChange}
                onMonopileStyleChange={handleMonopileStyleChange}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Manual Mode Indicator */}
      {!hasGeoJson && selectedMonopileId && (
        <div className="absolute bottom-4 left-4 z-10 px-4 py-2 bg-white/90 backdrop-blur-xs rounded-md shadow-sm border border-border animate-pulse-slow">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-boskalis-orange" />
            <span className="text-sm font-medium">Click on map to place monopile</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
