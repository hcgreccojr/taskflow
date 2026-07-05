import { Search, X } from 'lucide-react';
import type { Member } from '../../../shared/types/api';
import styles from './FilterBar.module.css';

export interface BoardFilters {
  search: string;
  assigneeId: string;
  priority: string;
}

interface FilterBarProps {
  filters: BoardFilters;
  members: Member[];
  onChange: (filters: BoardFilters) => void;
}

export function FilterBar({ filters, members, onChange }: FilterBarProps) {
  const hasActiveFilter = Boolean(filters.search || filters.assigneeId || filters.priority);

  return (
    <div className={styles.bar}>
      <div className={styles.searchWrapper}>
        <Search size={15} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Buscar por título"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
        />
      </div>

      <select
        className={styles.select}
        value={filters.assigneeId}
        onChange={(event) => onChange({ ...filters, assigneeId: event.target.value })}
      >
        <option value="">Responsável</option>
        {members.map((member) => (
          <option key={member.userId} value={member.userId}>
            {member.name}
          </option>
        ))}
      </select>

      <select
        className={styles.select}
        value={filters.priority}
        onChange={(event) => onChange({ ...filters, priority: event.target.value })}
      >
        <option value="">Prioridade</option>
        <option value="HIGH">Alta</option>
        <option value="MEDIUM">Média</option>
        <option value="LOW">Baixa</option>
      </select>

      {hasActiveFilter && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={() => onChange({ search: '', assigneeId: '', priority: '' })}
        >
          <X size={13} /> Limpar
        </button>
      )}
    </div>
  );
}
