
import { HeartPulse } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2 text-foreground font-headline">
      <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-br from-peach to-sky-blue text-white">
        <HeartPulse className="h-6 w-6" />
      </div>
      <span className="text-xl font-bold">Juvo</span>
    </div>
  );
}
