import { Search } from 'lucide-react';
import { Input } from '../ui/input';

export function SearchInput({ value, onChange, placeholder = 'Buscar...' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
      <Input className="pl-9" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
