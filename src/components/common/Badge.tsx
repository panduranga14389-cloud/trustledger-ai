import React from 'react';

interface StatusBadgeProps {
  status: 'Verified' | 'Pending' | 'Flagged';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'Verified':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          Verified
        </span>
      );
    case 'Pending':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          Pending
        </span>
      );
    case 'Flagged':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          Flagged
        </span>
      );
    default:
      return null;
  }
};

export const FormatINR: React.FC<{ amount: number; className?: string }> = ({ amount, className = '' }) => {
  return (
    <span className={`tabular-nums font-mono ${className}`}>
      ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
    </span>
  );
};
