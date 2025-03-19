
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export type Monopile = {
  id: string;
  [key: string]: any;
  lat?: number;
  lng?: number;
};

export interface ColumnOption {
  value: string;
  label: string;
}

export interface TableData {
  columns: ColumnOption[];
  rows: Monopile[];
  idColumnKey: string | null;
}

/**
 * Parses CSV or Excel file and returns structured data
 */
export const parseFileData = async (file: File): Promise<TableData> => {
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  
  if (fileExt === 'csv') {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const columns = Object.keys(results.data[0] || {}).map(key => ({
            value: key,
            label: key
          }));
          
          resolve({
            columns,
            rows: results.data as Monopile[],
            idColumnKey: null
          });
        }
      });
    });
  } else if (['xlsx', 'xls'].includes(fileExt || '')) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    const columns = Object.keys(jsonData[0] || {}).map(key => ({
      value: key,
      label: key
    }));
    
    return {
      columns,
      rows: jsonData as Monopile[],
      idColumnKey: null
    };
  }
  
  throw new Error('Unsupported file format');
};

/**
 * Parses GeoJSON file and returns GeoJSON object
 */
export const parseGeoJsonFile = async (file: File): Promise<GeoJSON.FeatureCollection> => {
  const text = await file.text();
  return JSON.parse(text) as GeoJSON.FeatureCollection;
};

/**
 * Extracts potential ID columns from GeoJSON properties
 */
export const extractGeoJsonIdColumns = (geojson: GeoJSON.FeatureCollection): ColumnOption[] => {
  const properties = geojson.features[0]?.properties || {};
  return Object.keys(properties).map(key => ({
    value: key,
    label: key
  }));
};

/**
 * Filters monopile data based on search query
 */
export const filterMonopiles = (
  monopiles: Monopile[],
  query: string,
  idColumnKey: string
): Monopile[] => {
  if (!query) return monopiles;
  const lowerQuery = query.toLowerCase();
  
  return monopiles.filter(monopile => {
    // First check ID column
    if (idColumnKey && String(monopile[idColumnKey]).toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // Then check all other columns
    for (const key in monopile) {
      if (String(monopile[key]).toLowerCase().includes(lowerQuery)) {
        return true;
      }
    }
    
    return false;
  });
};

/**
 * Updates monopile data with lat/lng coordinates
 */
export const updateMonopileCoordinates = (
  monopiles: Monopile[],
  idColumnKey: string,
  id: string,
  lat: number,
  lng: number
): Monopile[] => {
  return monopiles.map(monopile => {
    if (monopile[idColumnKey] === id) {
      return { ...monopile, lat, lng };
    }
    return monopile;
  });
};

/**
 * Creates a downloadable CSV file from monopile data
 */
export const exportToCSV = (monopiles: Monopile[]): string => {
  return Papa.unparse(monopiles);
};

/**
 * Creates a downloadable Excel file from monopile data
 */
export const exportToExcel = (monopiles: Monopile[]): ArrayBuffer => {
  const worksheet = XLSX.utils.json_to_sheet(monopiles);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Monopiles');
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
};
