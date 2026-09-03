import { cn } from '@/lib/utils';
import { BRAND_COLORS } from '@/lib/constants';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'flat';
  children: React.ReactNode;
}

export const Card = ({ className, variant = 'default', children, ...props }: CardProps) => {
  const baseStyles = 'rounded-2xl overflow-hidden';

  const variants = {
    default: `bg-[${BRAND_COLORS.primary}]/80 border border-white/10 shadow-lg`,
    glass: 'bg-white/5 backdrop-blur-sm border border-white/10',
    flat: 'bg-slate-800/50 border border-slate-700'
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </div>
  );
};

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader = ({ title, subtitle, action, className, ...props }: CardHeaderProps) => (
  <div className={cn('px-6 py-4 border-b border-white/5 flex items-center justify-between', className)} {...props}>
    <div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardContent = ({ className, children, ...props }: CardContentProps) => (
  <div className={cn('p-6', className)} {...props}>
    {children}
  </div>
);
