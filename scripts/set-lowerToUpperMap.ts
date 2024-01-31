import * as fs from 'fs';
import * as path from 'path';

interface PdfTitles {
  [key: string]: string[];
}

interface LowerToUpperMap {
  [key: string]: string;
}

async function updateLowerToUpperMap() {
  const lowerToUpperMapFilePath = path.join('utils', 'lowerToUpperMap.json');
  const pdfTitlesFilePath = path.join('utils', 'pdfNamestoNamespace.json');

  try {
    // Read and parse the JSON files
    const lowerToUpperMapData: LowerToUpperMap = JSON.parse(await fs.promises.readFile(lowerToUpperMapFilePath, 'utf8'));
    const pdfTitlesData: PdfTitles = JSON.parse(await fs.promises.readFile(pdfTitlesFilePath, 'utf8'));

    // Iterate over pdfTitlesData and update lowerToUpperMapData
    for (const [key, value] of Object.entries(pdfTitlesData)) {
      const title = value[0];
      const sanitizedTitle = title.replace(/ /g, '_'); // Replace spaces with underscores in the title
      const lowerSanitizedTitle = sanitizedTitle.toLowerCase();

      if (!lowerToUpperMapData[lowerSanitizedTitle]) {
        lowerToUpperMapData[lowerSanitizedTitle] = title;
      }
    }

    // Write the updated map back to the file
    await fs.promises.writeFile(lowerToUpperMapFilePath, JSON.stringify(lowerToUpperMapData, null, 2));

    console.log('Lower to upper title map updated successfully.');

  } catch (error) {
    console.error('Error updating lower to upper title map:', error);
  }
}

updateLowerToUpperMap();
