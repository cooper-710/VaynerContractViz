/**
 * Utility functions for Mocap Report PDF handling
 */

/**
 * Converts a player name to a PDF filename format
 * Example: "Pete Alonso" -> "Pete_Alonso.pdf"
 */
export function playerNameToPdfFilename(playerName: string): string {
  return `${playerName.replace(/\s+/g, '_')}.pdf`;
}

/**
 * Generates the public path for a player's mocap PDF
 */
export function getMocapPdfPath(playerName: string): string {
  return `/${playerNameToPdfFilename(playerName)}`;
}

/**
 * List of players who have mocap PDF reports available
 * This should be updated as more PDFs are added to the public folder
 */
const AVAILABLE_MOCAP_PDFS = new Set([
  'Pete_Alonso.pdf',
  // Add more PDF filenames here as they become available
  // Format: 'First_Last.pdf'
]);

/**
 * Checks if a mocap PDF exists for a given player
 */
export function hasMocapReport(playerName: string | null | undefined): boolean {
  if (!playerName) return false;
  const filename = playerNameToPdfFilename(playerName);
  return AVAILABLE_MOCAP_PDFS.has(filename);
}

