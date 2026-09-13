/**
 * Pul birligi har doim "so'm", minglik ajratgich bo'sh joy.
 * Masalan: formatSom(200000) -> "200 000 so'm"
 */
export function formatSom(amount: number): string {
  const formatted = new Intl.NumberFormat("ru-RU").format(Math.round(amount));
  return `${formatted} so'm`;
}
