import * as fs from 'fs';
import * as path from 'path';

async function updateRegexWithPdfNames() {
  const pdfNamesFilePath = path.join('utils', 'pdfNamestoNamespace.json');
  const regexFilePath = path.join('utils', 'regex.txt');

  try {
    // Read and parse the JSON file
    const pdfNamesData = JSON.parse(await fs.promises.readFile(pdfNamesFilePath, 'utf8'));

    // Extract values from pdfNamesData and flatten them into a single array
    const pdfNames = Object.values(pdfNamesData).flat();

    // Create a new regex pattern from the pdfNames
    const newPattern = '\\b(' + pdfNames.join('|') + ')\\b';

    // Write the new regex pattern to regex.txt
    await fs.promises.writeFile(regexFilePath, newPattern);

    console.log('Regex pattern updated successfully.');

  } catch (error) {
    console.error('Error updating regex pattern:', error);
  }
}

updateRegexWithPdfNames();
