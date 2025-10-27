/**
 * Generate inline SVG placeholder images for ads
 */
export function generatePlaceholderImage(
  width: number,
  height: number,
  text: string,
  bgColor: string = '#007bff',
  textColor: string = '#ffffff'
): string {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${bgColor}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.min(width, height) / 10}" font-weight="bold" fill="${textColor}">${text}</text></svg>`;
  
  // Use encodeURIComponent instead of btoa for better compatibility
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
