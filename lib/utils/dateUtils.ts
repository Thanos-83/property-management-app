export const parseLocalDate = (dateStr: string) => {
  // 1. We split the string "2026-05-25" to destroy the ISO format
  const [y, m, d] = dateStr.split('-'); 
  
  // 2. We pass the numbers directly: new Date(2026, 4, 25)
  // (Note: JavaScript months start at 0, so May is 4, which is why we do m - 1)
  return new Date(Number(y), Number(m) - 1, Number(d));
};