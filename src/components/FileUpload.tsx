
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ColumnOption } from '@/utils/dataUtils';
import { Badge } from '@/components/ui/badge';

interface FileUploadProps {
  onTableFileUploaded: (file: File) => void;
  onGeoJsonFileUploaded: (file: File) => void;
  onIdColumnSelected: (columnKey: string) => void;
  onGeoJsonIdColumnSelected: (columnKey: string | null) => void;
  tableColumns: ColumnOption[];
  geoJsonColumns: ColumnOption[];
}

const FileUpload: React.FC<FileUploadProps> = ({
  onTableFileUploaded,
  onGeoJsonFileUploaded,
  onIdColumnSelected,
  onGeoJsonIdColumnSelected,
  tableColumns,
  geoJsonColumns,
}) => {
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [isGeoJsonDialogOpen, setIsGeoJsonDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedIdColumn, setSelectedIdColumn] = useState<string>('');
  const [selectedGeoJsonIdColumn, setSelectedGeoJsonIdColumn] = useState<string | null>(null);
  const [tableFileName, setTableFileName] = useState<string | null>(null);
  const [geoJsonFileName, setGeoJsonFileName] = useState<string | null>(null);

  const onTableDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExt || '')) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }
    
    setSelectedFile(file);
    
    // Process the file first to extract columns
    onTableFileUploaded(file);
    
    // Then open the dialog to select the ID column
    setTimeout(() => {
      setIsTableDialogOpen(true);
    }, 500);
  }, [onTableFileUploaded]);

  const onGeoJsonDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'geojson') {
      toast.error('Please upload a GeoJSON file');
      return;
    }
    
    onGeoJsonFileUploaded(file);
    setGeoJsonFileName(file.name);
    setIsGeoJsonDialogOpen(true);
  }, [onGeoJsonFileUploaded]);

  const tableDropzone = useDropzone({
    onDrop: onTableDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  const geoJsonDropzone = useDropzone({
    onDrop: onGeoJsonDrop,
    accept: {
      'application/json': ['.geojson'],
    },
    multiple: false,
  });

  const handleConfirmTableFile = () => {
    if (!selectedFile || !selectedIdColumn) return;
    
    onIdColumnSelected(selectedIdColumn);
    setIsTableDialogOpen(false);
    setTableFileName(selectedFile.name);
    
    toast.success('Table file uploaded successfully');
  };

  const handleConfirmGeoJsonIdColumn = () => {
    onGeoJsonIdColumnSelected(selectedGeoJsonIdColumn);
    setIsGeoJsonDialogOpen(false);
    
    toast.success('GeoJSON ID column selected');
  };

  return (
    <div className="flex justify-end gap-2 py-1 px-4">
      {/* Show file badges if files are uploaded */}
      <div className="flex-1 flex items-center gap-2">
        {tableFileName && (
          <Badge variant="secondary" className="gap-1 py-1">
            <FileSpreadsheet className="h-3 w-3" />
            {tableFileName}
          </Badge>
        )}
        
        {geoJsonFileName && (
          <Badge variant="secondary" className="gap-1 py-1">
            <MapPin className="h-3 w-3" />
            {geoJsonFileName}
          </Badge>
        )}
      </div>
      
      {/* Compact upload buttons */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => tableDropzone.open()}
        className="gap-1"
      >
        <FileSpreadsheet className="h-4 w-4" /> 
        Upload Excel/CSV
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => geoJsonDropzone.open()}
        className="gap-1"
      >
        <MapPin className="h-4 w-4" /> 
        Upload GeoJSON
      </Button>
      
      {/* Hidden dropzones */}
      <div className="hidden">
        <div {...tableDropzone.getRootProps()}>
          <input {...tableDropzone.getInputProps()} />
        </div>
        <div {...geoJsonDropzone.getRootProps()}>
          <input {...geoJsonDropzone.getInputProps()} />
        </div>
      </div>

      {/* Table ID Column Selection Dialog */}
      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Monopile ID Column</DialogTitle>
            <DialogDescription>
              Choose which column in your data represents the unique monopile ID.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="id-column" className="block mb-2">
              Monopile ID Column
            </Label>
            <Select 
              value={selectedIdColumn} 
              onValueChange={setSelectedIdColumn}
            >
              <SelectTrigger className="w-full" id="id-column">
                <SelectValue placeholder="Select a column" />
              </SelectTrigger>
              <SelectContent>
                {tableColumns.length > 0 ? (
                  tableColumns.map((column) => (
                    <SelectItem key={column.value} value={column.value}>
                      {column.label}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-columns" disabled>No columns found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsTableDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmTableFile}
              disabled={!selectedIdColumn || tableColumns.length === 0}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GeoJSON ID Column Selection Dialog */}
      <Dialog open={isGeoJsonDialogOpen} onOpenChange={setIsGeoJsonDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select GeoJSON Monopile ID Column</DialogTitle>
            <DialogDescription>
              Optionally choose which property in the GeoJSON represents the monopile ID.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="geojson-id-column" className="block mb-2">
              GeoJSON ID Property (Optional)
            </Label>
            <Select 
              value={selectedGeoJsonIdColumn || "none"} 
              onValueChange={(value) => setSelectedGeoJsonIdColumn(value === "none" ? null : value)}
            >
              <SelectTrigger className="w-full" id="geojson-id-column">
                <SelectValue placeholder="Select a property (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {geoJsonColumns.map((column) => (
                  <SelectItem key={column.value} value={column.value}>
                    {column.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsGeoJsonDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmGeoJsonIdColumn}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileUpload;
