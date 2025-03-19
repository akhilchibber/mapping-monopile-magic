
import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MapStyle, MonopileStyle } from '@/utils/mapUtils';

interface StyleControlsProps {
  hasGeoJson: boolean;
  geoJsonStyle: MapStyle;
  monopileStyle: MonopileStyle;
  onGeoJsonStyleChange: (style: MapStyle) => void;
  onMonopileStyleChange: (style: MonopileStyle) => void;
}

const StyleControls: React.FC<StyleControlsProps> = ({
  hasGeoJson,
  geoJsonStyle,
  monopileStyle,
  onGeoJsonStyleChange,
  onMonopileStyleChange,
}) => {
  const handleGeoJsonColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onGeoJsonStyleChange({
      ...geoJsonStyle,
      color: e.target.value,
    });
  };

  const handleGeoJsonWidthChange = (value: number[]) => {
    onGeoJsonStyleChange({
      ...geoJsonStyle,
      width: value[0],
    });
  };

  const handleGeoJsonOpacityChange = (value: number[]) => {
    onGeoJsonStyleChange({
      ...geoJsonStyle,
      opacity: value[0],
    });
  };

  const handleMonopileColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMonopileStyleChange({
      ...monopileStyle,
      color: e.target.value,
    });
  };

  const handleMonopileBorderColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMonopileStyleChange({
      ...monopileStyle,
      borderColor: e.target.value,
    });
  };

  const handleMonopileSizeChange = (value: number[]) => {
    onMonopileStyleChange({
      ...monopileStyle,
      size: value[0],
    });
  };

  const handleMonopileBorderWidthChange = (value: number[]) => {
    onMonopileStyleChange({
      ...monopileStyle,
      borderWidth: value[0],
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-medium">Style Settings</h3>
      
      {hasGeoJson && (
        <>
          <div className="space-y-3">
            <h4 className="text-xs text-muted-foreground">GeoJSON Style</h4>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label htmlFor="geojson-color" className="text-xs">Color</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <input
                        id="geojson-color"
                        type="color"
                        value={geoJsonStyle.color}
                        onChange={handleGeoJsonColorChange}
                        className="h-6 w-10 rounded border cursor-pointer"
                      />
                      <span className="text-xs">{geoJsonStyle.color}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">GeoJSON color</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label htmlFor="geojson-width" className="text-xs">Width</Label>
              <Slider
                id="geojson-width"
                min={1}
                max={10}
                step={0.5}
                value={[geoJsonStyle.width]}
                onValueChange={handleGeoJsonWidthChange}
                className="w-full"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label htmlFor="geojson-opacity" className="text-xs">Opacity</Label>
              <Slider
                id="geojson-opacity"
                min={0.1}
                max={1}
                step={0.1}
                value={[geoJsonStyle.opacity]}
                onValueChange={handleGeoJsonOpacityChange}
                className="w-full"
              />
            </div>
          </div>
          
          <Separator />
        </>
      )}
      
      <div className="space-y-3">
        <h4 className="text-xs text-muted-foreground">Monopile Style</h4>
        
        <div className="grid grid-cols-2 gap-2 items-center">
          <Label htmlFor="monopile-color" className="text-xs">Fill Color</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <input
                    id="monopile-color"
                    type="color"
                    value={monopileStyle.color}
                    onChange={handleMonopileColorChange}
                    className="h-6 w-10 rounded border cursor-pointer"
                  />
                  <span className="text-xs">{monopileStyle.color}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Monopile fill color</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="grid grid-cols-2 gap-2 items-center">
          <Label htmlFor="monopile-border-color" className="text-xs">Border Color</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <input
                    id="monopile-border-color"
                    type="color"
                    value={monopileStyle.borderColor}
                    onChange={handleMonopileBorderColorChange}
                    className="h-6 w-10 rounded border cursor-pointer"
                  />
                  <span className="text-xs">{monopileStyle.borderColor}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Monopile border color</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="grid grid-cols-2 gap-2 items-center">
          <Label htmlFor="monopile-size" className="text-xs">Size</Label>
          <Slider
            id="monopile-size"
            min={3}
            max={15}
            step={1}
            value={[monopileStyle.size]}
            onValueChange={handleMonopileSizeChange}
            className="w-full"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2 items-center">
          <Label htmlFor="monopile-border-width" className="text-xs">Border Width</Label>
          <Slider
            id="monopile-border-width"
            min={0}
            max={5}
            step={0.5}
            value={[monopileStyle.borderWidth]}
            onValueChange={handleMonopileBorderWidthChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default StyleControls;
