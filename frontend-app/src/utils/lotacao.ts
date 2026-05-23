export interface LotacaoStyle {
  bg: string;
  text: string;
  icon: string;
  border: string;
}

export function getLotacaoStyle(nivel: number): LotacaoStyle {
  switch (nivel) {
    case 1: // Pouco movimentado
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        icon: 'person',
        border: 'border-emerald-500',
      };
    case 2: // Não muito movimentado
      return {
        bg: 'bg-teal-500/10 dark:bg-teal-500/20 border-teal-500/20',
        text: 'text-teal-700 dark:text-teal-400',
        icon: 'group',
        border: 'border-teal-500',
      };
    case 3: // Tão movimentado quanto o normal
      return {
        bg: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20',
        text: 'text-blue-700 dark:text-blue-400',
        icon: 'group',
        border: 'border-blue-500',
      };
    case 4: // Mais movimentado do que o normal
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20',
        text: 'text-amber-700 dark:text-amber-400',
        icon: 'groups',
        border: 'border-amber-500',
      };
    case 5: // Muito movimentado
      return {
        bg: 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20',
        text: 'text-rose-700 dark:text-rose-400',
        icon: 'groups',
        border: 'border-rose-500',
      };
    default:
      return {
        bg: 'bg-surface-container border-outline-variant/20',
        text: 'text-outline',
        icon: 'group',
        border: 'border-outline',
      };
  }
}
