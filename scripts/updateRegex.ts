import * as fs from 'fs';
import * as path from 'path';

async function updateRegexWithPdfNames() {
  const pdfNamesFilePath = path.join('utils', 'pdfNamestoNamespace.json');
  const regexFilePath = path.join('utils', 'materialsRegex.json');

  try {
    // Read and parse the JSON files
    const pdfNamesData = JSON.parse(await fs.promises.readFile(pdfNamesFilePath, 'utf8'));
    const regexData = JSON.parse(await fs.promises.readFile(regexFilePath, 'utf8'));

    // Extract values from pdfNamesData and flatten them into a single array
    const pdfNames = Object.values(pdfNamesData).flat();

    // Extract existing patterns from regexData
    let existingPatterns = regexData.pattern.split('|').map(pattern => pattern.trim());

    // Combine and remove duplicates
    const combinedPatterns = Array.from(new Set([...existingPatterns, ...pdfNames]));

    // Update the regex pattern in regexData
    regexData.pattern = '\\b(' + combinedPatterns.join('|') + ')\\b';

    // Write the updated regex back to the file
    await fs.promises.writeFile(regexFilePath, JSON.stringify(regexData, null, 2));

    console.log('Regex pattern updated successfully.');

  } catch (error) {
    console.error('Error updating regex pattern:', error);
  }
}

updateRegexWithPdfNames();