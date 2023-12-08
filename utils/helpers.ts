import * as fs from 'fs';
import * as path from 'path';

async function loadPattern() {
  try {
    const filePath = path.join('utils', 'materialsRegex.json');
    const jsonData = await fs.promises.readFile(filePath, 'utf8');
    const data = JSON.parse(jsonData);

    // Convert the string to a RegExp object
    const pattern = new RegExp(data.pattern, 'gi');

    return pattern;
  } catch (error) {
    console.error('Error loading regex pattern:', error);
    throw error;
  }
}

interface TitlesMap {
  [key: string]: string;
}

async function loadTitlesMap() {
  try {
    const filePath = path.join('utils', 'lowerToUpperMap.json');
    const jsonData = await fs.promises.readFile(filePath, 'utf8');
    const data: TitlesMap = JSON.parse(jsonData);
    return data;
  } catch (error) {
    console.error('Error loading titles map:', error);
    throw error;
  }
}

export async function extractTitlesFromQuery(query: string) {
    // extract name of textbooks from the query and return them as an array using regex
  
    const pattern: RegExp = /\b(PUBPOL_2350 Disparities_2023|PUBPOL_2350 International Comparisons_2023|PUBPOL_2350 International Comparisons_Part_2_2023|PUBPOL_2350 Malpractice_2023|PUBPOL_2350 Pharma and Biotech_Management_2023|PUBPOL_2350 Pharma and Biotech_Policy_2023|PUBPOL_2350 Pharma and Biotech_Policy_Part_2_2023|PUBPOL_2350 Quality_2023|PUBPOL_2350 Reform_Alternative_2023)\b/gi;

    //const pattern = await loadPattern();
    //const titlesMap = await loadTitlesMap();

      const titles: string[] = [];
    

      const titlesMap: Record<string, string> = {
        "pubpol_2350 disparities_2023": "PUBPOL_2350 Disparities_2023",
        "pubpol_2350 international comparisons_2023": "PUBPOL_2350 International Comparisons_2023",
        "pubpol_2350 international comparisons_part_2_2023": "PUBPOL_2350 International Comparisons_Part_2_2023",
        "pubpol_2350 malpractice_2023": "PUBPOL_2350 Malpractice_2023",
        "pubpol_2350 pharma and biotech_management_2023": "PUBPOL_2350 Pharma and Biotech_Management_2023",
        "pubpol_2350 pharma and biotech_policy_2023": "PUBPOL_2350 Pharma and Biotech_Policy_2023",
        "pubpol_2350 pharma and biotech_policy_part_2_2023": "PUBPOL_2350 Pharma and Biotech_Policy_Part_2_2023",
        "pubpol_2350 quality_2023": "PUBPOL_2350 Quality_2023",
        "pubpol_2350 reform_alternative_2023": "PUBPOL_2350 Reform_Alternative_2023"
    };
    
      let match: RegExpExecArray | null;
  
      while ((match = pattern.exec(query)) !== null) {
          titles.push(match[1]);
      }
  
      // Filter out duplicate titles, ignoring case
      const uniqueTitles = titles.filter((value, index, self) => {
          return self.findIndex(t => t.toLowerCase() === value.toLowerCase()) === index;
      });
  
      // Return titles in the exact casing as specified in the regex pattern
      const correctedCaseTitles = uniqueTitles.map(t => titlesMap[t.toLowerCase()]);
  
      return correctedCaseTitles;
  }
    
  
  