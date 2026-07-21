import { StatusBadge } from '../../../components/common/StatusBadge';

export function CustomerStatusBadge({ active }: { active: boolean }) {
  return <StatusBadge active={active} />;
}
