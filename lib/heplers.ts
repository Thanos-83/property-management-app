export function capitalizeFirstLetter(string: string) {
  return string.replace(/^./, string[0].toUpperCase());
}


// --- NEW: Greece Timezone Formatter ---
export const formatGreeceTime = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Athens',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
};
