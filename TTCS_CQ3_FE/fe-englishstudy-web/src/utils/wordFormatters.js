export function formatWordType(type) {
  if (!type || typeof type !== 'string') return 'Khác';

  const t = type.trim().toLowerCase();

  
  if (['n', 'noun', 'danh từ', 'danh tu', 'danh'].includes(t)) return 'Danh từ';

  
  if (['v', 'verb', 'động từ', 'dong tu', 'động'].includes(t)) return 'Động từ';

  
  if (['adj', 'adjective', 'tính từ', 'tinh tu', 'tính'].includes(t)) return 'Tính từ';

  
  if (['adv', 'adverb', 'trạng từ', 'trang tu', 'trạng'].includes(t)) return 'Trạng từ';

  
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}