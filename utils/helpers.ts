export function unixTimestampToYMD(unixTimestamp: number): string {
  // Convert the UNIX timestamp (seconds) to a Date object
  const date = new Date(unixTimestamp * 1000);

  // Extract year, month, and day
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are 0-based in JS
  const day = date.getUTCDate().toString().padStart(2, '0');

  // Return in the format: YYYY-MM-DD
  return `${year}-${month}-${day}`;
}