
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-border animate-fade-in">
      <div className="flex items-center gap-4">
        <img 
          src="/lovable-uploads/783c9f5d-cc41-4a0b-9c4d-af5f1d3b5deb.png" 
          alt="Boskalis Logo"
          className="h-10 object-contain" 
        />
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-medium text-boskalis-dark-blue">Marshalling Yard</h1>
          <div className="h-6 w-px bg-border mx-1"></div>
          <span className="text-sm text-muted-foreground">Dashboard</span>
        </div>
      </div>
      
      <div className="relative w-full max-w-md transition-all duration-200 focus-within:max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-boskalis-light-blue"
          placeholder="Search monopiles..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </header>
  );
};

export default Header;
