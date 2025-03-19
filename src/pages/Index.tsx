
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Map from '@/components/Map';
import DataTable from '@/components/DataTable';
import FileUpload from '@/components/FileUpload';
import { 
  Monopile, 
  TableData,
  ColumnOption,
  parseFileData,
  parseGeoJsonFile,
  extractGeoJsonIdColumns,
  filterMonopiles,
  updateMonopileCoordinates,
  exportToCSV,
  exportToExcel
} from '@/utils/dataUtils';
import { 
  extractMonopilesFromGeoJson,
  createGeoJsonFromMonopiles
} from '@/utils/mapUtils';

const Index = () => {
  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [tableData, setTableData] = useState<TableData>({
    columns: [],
    rows: [],
    idColumnKey: null
  });
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [geoJsonColumns, setGeoJsonColumns] = useState<ColumnOption[]>([]);
  const [geoJsonIdColumn, setGeoJsonIdColumn] = useState<string | null>(null);
  const [selectedMonopileId, setSelectedMonopileId] = useState<string | null>(null);
  const [filteredIds, setFilteredIds] = useState<string[]>([]);
  
  // Refs
  const resizableRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  
  // Initialize resizable panels
  useEffect(() => {
    if (!resizableRef.current || !resizerRef.current || !leftPanelRef.current || !rightPanelRef.current) return;
    
    const resizer = resizerRef.current;
    const leftPanel = leftPanelRef.current;
    const rightPanel = rightPanelRef.current;
    const container = resizableRef.current;
    
    let x = 0;
    let leftWidth = 0;
    
    const onMouseDown = (e: MouseEvent) => {
      x = e.clientX;
      leftWidth = leftPanel.getBoundingClientRect().width;
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      
      resizer.classList.add('bg-boskalis-blue');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };
    
    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - x;
      const containerWidth = container.getBoundingClientRect().width;
      
      // Calculate new width as percentage
      const newLeftWidthPercent = ((leftWidth + dx) / containerWidth) * 100;
      
      // Limit the minimum and maximum sizes (10% - 90%)
      const boundedWidth = Math.min(Math.max(newLeftWidthPercent, 10), 90);
      
      leftPanel.style.width = `${boundedWidth}%`;
      rightPanel.style.width = `${100 - boundedWidth}%`;
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      resizer.classList.remove('bg-boskalis-blue');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    
    resizer.addEventListener('mousedown', onMouseDown);
    
    return () => {
      resizer.removeEventListener('mousedown', onMouseDown);
    };
  }, []);
  
  // Handle search query changes
  useEffect(() => {
    if (!tableData.idColumnKey || !searchQuery) {
      setFilteredIds([]);
      return;
    }
    
    const filtered = filterMonopiles(tableData.rows, searchQuery, tableData.idColumnKey);
    const ids = filtered.map(m => m[tableData.idColumnKey as string]);
    setFilteredIds(ids);
  }, [searchQuery, tableData.rows, tableData.idColumnKey]);
  
  // Handle table file upload
  const handleTableFileUpload = async (file: File) => {
    try {
      const data = await parseFileData(file);
      setTableData(data);
    } catch (error) {
      console.error('Error parsing table file:', error);
      toast.error('Failed to parse the file. Please check the format.');
    }
  };
  
  // Handle GeoJSON file upload
  const handleGeoJsonFileUpload = async (file: File) => {
    try {
      const data = await parseGeoJsonFile(file);
      setGeoJsonData(data);
      
      // Extract column options from the GeoJSON
      const columns = extractGeoJsonIdColumns(data);
      setGeoJsonColumns(columns);
      
      toast.success('GeoJSON file loaded successfully');
    } catch (error) {
      console.error('Error parsing GeoJSON file:', error);
      toast.error('Failed to parse the GeoJSON file. Please check the format.');
    }
  };
  
  // Handle ID column selection for table data
  const handleIdColumnSelect = (columnKey: string) => {
    setTableData(prev => ({
      ...prev,
      idColumnKey: columnKey
    }));
    
    // If we have GeoJSON monopiles with the same ID column, we could link them here
    if (geoJsonData && geoJsonIdColumn === columnKey) {
      const monopiles = extractMonopilesFromGeoJson(geoJsonData, columnKey);
      
      // Merge the coordinates with the existing table data
      setTableData(prev => {
        const updatedRows = prev.rows.map(row => {
          const match = monopiles.find(m => m[columnKey] === row[columnKey]);
          if (match) {
            return {
              ...row,
              lat: match.lat,
              lng: match.lng
            };
          }
          return row;
        });
        
        return {
          ...prev,
          rows: updatedRows
        };
      });
    }
  };
  
  // Handle ID column selection for GeoJSON data
  const handleGeoJsonIdColumnSelect = (columnKey: string | null) => {
    setGeoJsonIdColumn(columnKey);
    
    if (columnKey && tableData.idColumnKey === columnKey && tableData.rows.length > 0) {
      // Link the GeoJSON points with table data using the ID column
      const monopiles = extractMonopilesFromGeoJson(geoJsonData!, columnKey);
      
      // Update table data with coordinates from GeoJSON
      setTableData(prev => {
        const updatedRows = prev.rows.map(row => {
          const match = monopiles.find(m => m[columnKey] === row[columnKey]);
          if (match) {
            return {
              ...row,
              lat: match.lat,
              lng: match.lng
            };
          }
          return row;
        });
        
        return {
          ...prev,
          rows: updatedRows
        };
      });
    }
  };
  
  // Handle monopile selection for manual map placement
  const handleMonopileSelect = (id: string) => {
    setSelectedMonopileId(id);
  };
  
  // Handle map click for placing monopiles
  const handleMapClick = (lat: number, lng: number) => {
    if (!selectedMonopileId || !tableData.idColumnKey) return;
    
    // Update the monopile coordinates
    const updatedRows = updateMonopileCoordinates(
      tableData.rows,
      tableData.idColumnKey,
      selectedMonopileId,
      lat,
      lng
    );
    
    setTableData(prev => ({
      ...prev,
      rows: updatedRows
    }));
    
    toast.success(`Updated coordinates for monopile ${selectedMonopileId}`);
  };
  
  // Handle data export
  const handleDownload = () => {
    if (tableData.rows.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    try {
      // Create CSV data
      const csvData = exportToCSV(tableData.rows);
      
      // Create download link
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'monopile_data.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
      />
      
      <div className="p-4">
        <FileUpload 
          onTableFileUploaded={handleTableFileUpload}
          onGeoJsonFileUploaded={handleGeoJsonFileUpload}
          onIdColumnSelected={handleIdColumnSelect}
          onGeoJsonIdColumnSelected={handleGeoJsonIdColumnSelect}
          tableColumns={tableData.columns}
          geoJsonColumns={geoJsonColumns}
        />
      </div>
      
      <div 
        ref={resizableRef}
        className="flex-1 flex overflow-hidden px-4 pb-4"
      >
        {/* Left Panel (Map) */}
        <div 
          ref={leftPanelRef}
          className="w-1/2 h-full overflow-hidden rounded-lg shadow-subtle glass-panel animate-fade-in"
        >
          <Map 
            geoJsonData={geoJsonData}
            monopiles={tableData.rows}
            tableIdColumn={tableData.idColumnKey}
            geoJsonIdColumn={geoJsonIdColumn}
            filteredIds={filteredIds}
            hasGeoJson={!!geoJsonData}
            onMapClick={handleMapClick}
            selectedMonopileId={selectedMonopileId}
          />
        </div>
        
        {/* Resizer */}
        <div 
          ref={resizerRef}
          className="resizer mx-2"
        />
        
        {/* Right Panel (Table) */}
        <div 
          ref={rightPanelRef}
          className="w-1/2 h-full rounded-lg shadow-subtle glass-panel animate-fade-in"
        >
          <DataTable 
            data={tableData.rows}
            columns={tableData.columns}
            idColumnKey={tableData.idColumnKey}
            filteredIds={filteredIds}
            searchQuery={searchQuery}
            onRowSelect={handleMonopileSelect}
            selectedMonopileId={selectedMonopileId}
            hasGeoJson={!!geoJsonData}
            onDownload={handleDownload}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
