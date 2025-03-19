
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Circle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { type Monopile, type ColumnOption } from '@/utils/dataUtils';

interface DataTableProps {
  data: Monopile[];
  columns: ColumnOption[];
  idColumnKey: string | null;
  filteredIds: string[];
  searchQuery: string;
  onRowSelect: (id: string) => void;
  selectedMonopileId: string | null;
  hasGeoJson: boolean;
  onDownload: () => void;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  idColumnKey,
  filteredIds,
  searchQuery,
  onRowSelect,
  selectedMonopileId,
  hasGeoJson,
  onDownload,
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleHeaderClick = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (monopile: Monopile) => {
    if (!idColumnKey || hasGeoJson) return;
    
    onRowSelect(monopile[idColumnKey]);
    toast.info(`Selected monopile: ${monopile[idColumnKey]}`);
  };

  // Sort data based on current sort settings
  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (aValue === bValue) return 0;
    
    const isAsc = sortDirection === 'asc';
    
    // Handle different data types
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return isAsc ? aValue - bValue : bValue - aValue;
    }
    
    // Convert to strings for comparison
    const aString = String(aValue || '').toLowerCase();
    const bString = String(bValue || '').toLowerCase();
    
    return isAsc 
      ? aString.localeCompare(bString) 
      : bString.localeCompare(aString);
  });
  
  // Filter data based on search query if there are filteredIds
  const displayData = searchQuery && filteredIds.length > 0 && idColumnKey
    ? sortedData.filter(row => filteredIds.includes(row[idColumnKey]))
    : sortedData;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-medium text-boskalis-dark-blue">
          Monopile Data
          {displayData.length !== data.length && (
            <span className="ml-2 text-sm text-muted-foreground">
              ({displayData.length} of {data.length})
            </span>
          )}
        </h2>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1"
          onClick={onDownload}
        >
          <Download className="h-4 w-4" />
          <span className="ml-1">Export</span>
        </Button>
      </div>
      
      <div className="table-container custom-scrollbar">
        <Table>
          <TableHeader className="sticky top-0 bg-white">
            <TableRow>
              {!hasGeoJson && idColumnKey && (
                <TableHead className="w-10 text-center">Select</TableHead>
              )}
              
              {columns.map((column) => (
                <TableHead 
                  key={column.value}
                  onClick={() => handleHeaderClick(column.value)}
                  className={`cursor-pointer hover:bg-muted/50 ${
                    sortColumn === column.value ? 'bg-muted/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {sortColumn === column.value && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (!hasGeoJson && idColumnKey ? 1 : 0)} className="text-center py-10 text-muted-foreground">
                  {data.length === 0 
                    ? 'No data available. Please upload a file.' 
                    : 'No matching monopiles found.'}
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((row, rowIndex) => (
                <TableRow 
                  key={rowIndex}
                  className={`${
                    idColumnKey && row[idColumnKey] === selectedMonopileId 
                      ? 'bg-boskalis-light-blue/10' 
                      : ''
                  } ${
                    !hasGeoJson && idColumnKey 
                      ? 'cursor-pointer hover:bg-muted/30 transition-colors' 
                      : ''
                  }`}
                  onClick={() => handleRowClick(row)}
                >
                  {!hasGeoJson && idColumnKey && (
                    <TableCell className="text-center">
                      {row[idColumnKey] === selectedMonopileId ? (
                        <CheckCircle className="h-5 w-5 text-boskalis-light-blue inline-block" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/50 inline-block" />
                      )}
                    </TableCell>
                  )}
                  
                  {columns.map((column) => (
                    <TableCell key={column.value}>
                      {row[column.value] !== undefined ? String(row[column.value]) : ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DataTable;
