/**
 * Ro'yxat sahifalash sozlamalari. Bu modul "use client" emas: server sahifalar
 * (`readPaging`) ham, client `TablePager` ham undan foydalanadi.
 */
export const PAGE_SIZES = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 50;

/** URL'dagi `page` va `size` dan xavfsiz qiymatlar. */
export function readPaging(params: { page?: string; size?: string }) {
  const size = PAGE_SIZES.includes(Number(params.size)) ? Number(params.size) : DEFAULT_PAGE_SIZE;
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);
  return { page, size };
}
