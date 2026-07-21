import { StatusBadge } from '../../../components/common/StatusBadge';
import { fuelTypeOptions, transmissionTypeOptions } from '../../../config/catalogs';
import { cn } from '../../../lib/utils';
import type { FuelType, TransmissionType } from '../types/vehicle.types';

export function VehicleStatusBadge({ active }: { active: boolean }) {
  return <StatusBadge active={active} />;
}

export function FuelBadge({ fuelType }: { fuelType: FuelType }) {
  const label = fuelTypeOptions.find((option) => option.value === fuelType)?.label ?? fuelType;
  return <span className="rounded-full bg-cyan-100 px-2 py-1 text-xs font-medium text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200">{label}</span>;
}

export function TransmissionBadge({ transmissionType }: { transmissionType: TransmissionType }) {
  const label = transmissionTypeOptions.find((option) => option.value === transmissionType)?.label ?? transmissionType;
  return <span className={cn('rounded-full px-2 py-1 text-xs font-medium', 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200')}>{label}</span>;
}
