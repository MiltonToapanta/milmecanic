import type { DiagnosticSummaryValues, ServiceDiagnosticItem } from '../types/service-diagnostic.types';

export function getDiagnosticSummary(items: ServiceDiagnosticItem[]): DiagnosticSummaryValues {
  return {
    total: items.length,
    good: items.filter((item) => item.status === 'GOOD').length,
    regular: items.filter((item) => item.status === 'REGULAR').length,
    bad: items.filter((item) => item.status === 'BAD').length,
    notChecked: items.filter((item) => item.status === 'NOT_CHECKED').length,
    critical: items.filter((item) => item.severity === 'CRITICAL').length
  };
}
