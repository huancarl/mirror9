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
  
    const pattern: RegExp = /\b(PUBPOL_2350 Disparities_2023|PUBPOL_2350 International Comparisons_2023|PUBPOL_2350 International Comparisons_Part_2_2023|PUBPOL_2350 Malpractice_2023|PUBPOL_2350 Pharma and Biotech_Management_2023|PUBPOL_2350 Pharma and Biotech_Policy_2023|PUBPOL_2350 Pharma and Biotech_Policy_Part_2_2023|PUBPOL_2350 Quality_2023|PUBPOL_2350 Reform_Alternative_2023|INFO 2950 FA23_Midterm_QuestionSheet|INFO 2950 Final Fall 2023 - Review Topics|INFO 2950 INFO 2950 Fall 2022 Midterm Solutions|INFO 2950 INFO 2950 Final Fall 2022 questions|INFO 2950 INFO2950_FA22_MidtermQuestions|INFO 2950 INFO2950_Koenecke_Syllabus|INFO 2950 INFO2950_Lec1_20230821|INFO 2950 INFO2950_Lec2_20230823|INFO 2950 INFO2950_Lec3_20230828|INFO 2950 INFO2950_Lec4_20230830|INFO 2950 INFO2950_Lec5_20230906|INFO 2950 INFO2950_Lec6_20230911|INFO 2950 INFO2950_Lec7_20230913|INFO 2950 INFO2950_Lec8_20230918|INFO 2950 INFO2950_Lec9_20230920|INFO 2950 INFO2950_Lec10_20230925|INFO 2950 INFO2950_Lec11_20230927|INFO 2950 INFO2950_Lec12_20231004|INFO 2950 INFO2950_Lec13_20231011|INFO 2950 INFO2950_Lec14_20231016|INFO 2950 INFO2950_Lec15_20231018 2|INFO 2950 INFO2950_Lec16_20231023 2|INFO 2950 INFO2950_Lec17_20231025 2|INFO 2950 INFO2950_Lec18_20231030|INFO 2950 INFO2950_Lec19_20231101|INFO 2950 INFO2950_Lec20_20231106|INFO 2950 INFO2950_Lec21_20231108|INFO 2950 INFO2950_Lec22_20231113|INFO 2950 INFO2950_Lec23_20231115 2|INFO 2950 INFO2950_Lec24_20231120 2|INFO 2950 INFO2950_Lec25_20231127 2|INFO 2950 INFO2950_Lec26_20231129 2|INFO 2950 INFO2950_Lec27_20231204 2|INFO 2950 INFO2950-Handbook|INFO 2950 Lec 20 clarification examples 20231106|INFO 2950 Lec10_ChalkboardExample_20230925|INFO 2950 Midterm Fall 2023 - Review Topics|INFO 2950 FA23_Midterm_Solutions)\b/gi;


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
        "pubpol_2350 reform_alternative_2023": "PUBPOL_2350 Reform_Alternative_2023",



    "info 2950 fa23_midterm_questionsheet": "INFO 2950 FA23_Midterm_QuestionSheet",
    "info 2950 final fall 2023 - review topics": "INFO 2950 Final Fall 2023 - Review Topics",
    "info 2950 info 2950 fall 2022 midterm solutions": "INFO 2950 INFO 2950 Fall 2022 Midterm Solutions",
    "info 2950 info 2950 final fall 2022 questions": "INFO 2950 INFO 2950 Final Fall 2022 questions",
    "info 2950 info2950_fa22_midtermquestions": "INFO 2950 INFO2950_FA22_MidtermQuestions",
    "info 2950 info2950_koenecke_syllabus": "INFO 2950 INFO2950_Koenecke_Syllabus",
    "info 2950 info2950_lec1_20230821": "INFO 2950 INFO2950_Lec1_20230821",
    "info 2950 info2950_lec2_20230823": "INFO 2950 INFO2950_Lec2_20230823",
    "info 2950 info2950_lec3_20230828": "INFO 2950 INFO2950_Lec3_20230828",
    "info 2950 info2950_lec4_20230830": "INFO 2950 INFO2950_Lec4_20230830",
    "info 2950 info2950_lec5_20230906": "INFO 2950 INFO2950_Lec5_20230906",
    "info 2950 info2950_lec6_20230911": "INFO 2950 INFO2950_Lec6_20230911",
    "info 2950 info2950_lec7_20230913": "INFO 2950 INFO2950_Lec7_20230913",
    "info 2950 info2950_lec8_20230918": "INFO 2950 INFO2950_Lec8_20230918",
    "info 2950 info2950_lec9_20230920": "INFO 2950 INFO2950_Lec9_20230920",
    "info 2950 info2950_lec10_20230925": "INFO 2950 INFO2950_Lec10_20230925",
    "info 2950 info2950_lec11_20230927": "INFO 2950 INFO2950_Lec11_20230927",
    "info 2950 info2950_lec12_20231004": "INFO 2950 INFO2950_Lec12_20231004",
    "info 2950 info2950_lec13_20231011": "INFO 2950 INFO2950_Lec13_20231011",
    "info 2950 info2950_lec14_20231016": "INFO 2950 INFO2950_Lec14_20231016",
    "info 2950 info2950_lec15_20231018 2": "INFO 2950 INFO2950_Lec15_20231018 2",
    "info 2950 info2950_lec16_20231023 2": "INFO 2950 INFO2950_Lec16_20231023 2",
    "info 2950 info2950_lec17_20231025 2": "INFO 2950 INFO2950_Lec17_20231025 2",
    "info 2950 info2950_lec18_20231030": "INFO 2950 INFO2950_Lec18_20231030",
    "info 2950 info2950_lec19_20231101": "INFO 2950 INFO2950_Lec19_20231101",
    "info 2950 info2950_lec20_20231106": "INFO 2950 INFO2950_Lec20_20231106",
    "info 2950 info2950_lec21_20231108": "INFO 2950 INFO2950_Lec21_20231108",
    "info 2950 info2950_lec22_20231113": "INFO 2950 INFO2950_Lec22_20231113",
    "info 2950 info2950_lec23_20231115 2": "INFO 2950 INFO2950_Lec23_20231115 2",
    "info 2950 info2950_lec24_20231120 2": "INFO 2950 INFO2950_Lec24_20231120 2",
    "info 2950 info2950_lec25_20231127 2": "INFO 2950 INFO2950_Lec25_20231127 2",
    "info 2950 info2950_lec26_20231129 2": "INFO 2950 INFO2950_Lec26_20231129 2",
    "info 2950 info2950_lec27_20231204 2": "INFO 2950 INFO2950_Lec27_20231204 2",
    "info 2950 info2950-handbook": "INFO 2950 INFO2950-Handbook",
    "info 2950 lec 20 clarification examples 20231106": "INFO 2950 Lec 20 clarification examples 20231106",
    "info 2950 lec10_chalkboardexample_20230925": "INFO 2950 Lec10_ChalkboardExample_20230925",
    "info 2950 midterm fall 2023 - review topics": "INFO 2950 Midterm Fall 2023 - Review Topics",
    "info 2950 fa23_midterm_solutions": "INFO 2950 FA23_Midterm_Solutions"
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
    
  
  