
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, MapPin } from 'lucide-react';
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

  const onTableDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExt || '')) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }
    
    setSelectedFile(file);
    setIsTableDialogOpen(true);
  }, []);

  const onGeoJsonDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'geojson') {
      toast.error('Please upload a GeoJSON file');
      return;
    }
    
    onGeoJsonFileUploaded(file);
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
    
    onTableFileUploaded(selectedFile);
    onIdColumnSelected(selectedIdColumn);
    setIsTableDialogOpen(false);
    
    toast.success('Table file uploaded successfully');
  };

  const handleConfirmGeoJsonIdColumn = () => {
    onGeoJsonIdColumnSelected(selectedGeoJsonIdColumn);
    setIsGeoJsonDialogOpen(false);
    
    toast.success('GeoJSON ID column selected');
  };

  return (
    <div className="flex flex-col gap-4 p-4 glass-panel rounded-lg animate-scale-in">
      <h2 className="text-lg font-medium text-boskalis-dark-blue">Upload Files</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Table File Upload */}
        <div 
          {...tableDropzone.getRootProps()} 
          className={`upload-dropzone ${tableDropzone.isDragActive ? 'active' : ''}`}
        >
          <input {...tableDropzone.getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 rounded-full bg-boskalis-light-blue/10 text-boskalis-light-blue">
              <File className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">Upload CSV or Excel</p>
            <p className="text-xs text-muted-foreground">Drag & drop or click to browse</p>
          </div>
        </div>

        {/* GeoJSON File Upload */}
        <div 
          {...geoJsonDropzone.getRootProps()} 
          className={`upload-dropzone ${geoJsonDropzone.isDragActive ? 'active' : ''}`}
        >
          <input {...geoJsonDropzone.getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 rounded-full bg-boskalis-orange/10 text-boskalis-orange">
              <MapPin className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">Upload GeoJSON</p>
            <p className="text-xs text-muted-foreground">Drag & drop or click to browse</p>
          </div>
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
                {tableColumns.map((column) => (
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
              onClick={() => setIsTableDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmTableFile}
              disabled={!selectedIdColumn}
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
              value={selectedGeoJsonIdColumn || ''} 
              onValueChange={setSelectedGeoJsonIdColumn}
            >
              <SelectTrigger className="w-full" id="geojson-id-column">
                <SelectValue placeholder="Select a property (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
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
