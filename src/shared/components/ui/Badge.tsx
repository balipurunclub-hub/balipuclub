import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent';
  children: React.ReactNode;
}

export const Badge = ({ className, variant = 'default', children, ...props }: BadgeProps) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider';

  const variants = {
    default: 'bg-white/10 text-slate-300',
    success: 'bg-green-500/10 text-green-400',
    warning: 'bg-yellow-500/10 text-yellow-400',
    error: 'bg-red-500/10 text-red-400',
    info: 'bg-blue-500/10 text-blue-400',
    accent: 'bg-[#F5841F]/10 text-[#F5841F]'
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </span>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    paid: 'success',
    pending: 'warning',
    failed: 'error',
    free: 'info'
  };

  return (
    <Badge variant={variants[status] || 'default'}>
      {status}
    </Badge>
  );
};

export const EntryTypeBadge = ({ type }: { type: 'paid' | 'free' }) => {
  return (
    <Badge variant={type === 'paid' ? 'accent' : 'info'}>
      {type === 'paid' ? 'Paid Entry' : 'Free Entry'}
    </Badge>
  );
};
