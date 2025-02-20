import { cn } from '@/lib/utils';

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-1", className)}>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="w-2 h-2 bg-current rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}
