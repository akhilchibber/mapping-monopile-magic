
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <header className="flex flex-col gap-4 p-4 animate-fade-in">
      <div className="flex items-center justify-between">
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
      </div>
      
      {/* Full-width search bar */}
      <div className="relative w-full transition-all duration-200">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          className="pl-10 py-6 bg-muted/30 border focus-visible:ring-1 focus-visible:ring-boskalis-light-blue text-lg"
          placeholder="Search monopiles..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </header>
  );
};

export default Header;
