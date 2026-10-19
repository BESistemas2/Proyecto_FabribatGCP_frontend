'use client';

import { formatMoney, formatMoneyCompact } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface MoneyFormatProps {
  value: number | string | null | undefined;
  compact?: boolean;
  showSign?: boolean;
  className?: string;
  alignRight?: boolean;
  zeroAsDash?: boolean;
  negativeColor?: boolean;
}

export function MoneyFormat({
  value,
  compact = false,
  showSign = false,
  className,
  alignRight = true,
  zeroAsDash = false,
  negativeColor = true,
}: MoneyFormatProps) {
  const numValue = typeof value === 'string' ? parseFloat(value) : (value ?? 0);

  if (isNaN(numValue)) {
    return <span className={cn('font-mono tabular-nums', className)}>—</span>;
  }

  if (zeroAsDash && numValue === 0) {
    return <span className={cn('font-mono tabular-nums text-muted-foreground', className)}>—</span>;
  }

  const formatted = compact
    ? formatMoneyCompact(numValue)
    : formatMoney(numValue, { showSign });

  const colorClass = negativeColor && numValue < 0 ? 'text-destructive' : '';
  const signPrefix = showSign && numValue > 0 ? '+' : '';

  return (
    <span
      className={cn(
        'font-mono tabular-nums',
        alignRight && 'text-right',
        colorClass,
        className
      )}
    >
      {signPrefix}{formatted}
    </span>
  );
}

export function MoneyDiff({
  actual,
  expected,
  className,
  compact = false,
}: {
  actual: number | string | null | undefined;
  expected: number | string | null | undefined;
  className?: string;
  compact?: boolean;
}) {
  const actualNum = typeof actual === 'string' ? parseFloat(actual) : (actual ?? 0);
  const expectedNum = typeof expected === 'string' ? parseFloat(expected) : (expected ?? 0);

  if (isNaN(actualNum) || isNaN(expectedNum)) {
    return <MoneyFormat value={0} compact={compact} className={className} />;
  }

  const diff = actualNum - expectedNum;
  const isPositive = diff > 0;
  const isNegative = diff < 0;

  return (
    <MoneyFormat
      value={diff}
      compact={compact}
      showSign
      className={cn(
        className,
        isPositive && 'text-green-600 dark:text-green-400',
        isNegative && 'text-red-600 dark:text-red-400',
        diff === 0 && 'text-muted-foreground'
      )}
    />
  );
}