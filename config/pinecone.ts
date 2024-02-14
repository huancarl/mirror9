/**
 * Change the namespace to the namespace on Pinecone you'd like to store your embeddings.
 */
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error('Missing Pinecone index name in .env file');
}

// const jsonFilePath = path.join('utils', 'pdfNamestoNamespace.json');

const jsonFilePath = path.join('utils', 'pdfNamestoNamespace.json');
const NAMESPACE_NUMB = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8')); 

const PINECONE_INDEX_NAME = 'gptcornell1';

// const NAMESPACE_NUMB: { [key: string]: string[] } = {

//   //AEM 2241
//   // '2023 Fall AEM 2241 hw1': ['AEM 2241 2023 Fall AEM 2241 hw1'],
//   // '2023 Fall AEM 2241 hw2': ['AEM 2241 2023 Fall AEM 2241 hw2'],
//   // '2023 Fall AEM 2241 hw3': ['AEM 2241 2023 Fall AEM 2241 hw3'],
//   // '2023 Fall AEM 2241 hw4': ['AEM 2241 2023 Fall AEM 2241 hw4'],
//   // '20230822 AEM 2241 Time Value of Money - HANDOUT': ['AEM 2241 20230822 AEM 2241 Time Value of Money - HANDOUT'],
//   // '20230824 In-class notes': ['AEM 2241 20230824 In-class notes'],
//   // '20230828 AEM 2241 Discounted Cash Flow Valuation - HANDOUT (1)': ['AEM 2241 20230828 AEM 2241 Discounted Cash Flow Valuation - HANDOUT (1)'],
//   // '20230829 In-class notes': ['AEM 2241 20230829 In-class notes'],
//   // '20230830 AEM 2241 Discounted Cash Flow Valuation II HANDOUT': ['AEM 2241 20230830 AEM 2241 Discounted Cash Flow Valuation II HANDOUT'],
//   // '20230831 In-class notes': ['AEM 2241 20230831 In-class notes'],
//   // '20230905 AEM 2241 Discounted Cash Flow Valuation III HANDOUT': ['AEM 2241 20230905 AEM 2241 Discounted Cash Flow Valuation III HANDOUT'],
//   // '20230905 In-class notes': ['AEM 2241 20230905 In-class notes'],
//   // '20230907 In-class notes': ['AEM 2241 20230907 In-class notes'],
//   // '20230911 AEM 2241 Bonds and Bond Valuation HANDOUT': ['AEM 2241 20230911 AEM 2241 Bonds and Bond Valuation HANDOUT'],
//   // '20230912 In-class notes': ['AEM 2241 20230912 In-class notes'],
//   // '20230913 AEM 2241 Formula sheet v1 (1)': ['AEM 2241 20230913 AEM 2241 Formula sheet v1 (1)'],
//   // '20230913 AEM 2241 v1 SOLUTIONS': ['AEM 2241 20230913 AEM 2241 v1 SOLUTIONS'],
//   // '20230913 AEM 2241 v1': ['AEM 2241 20230913 AEM 2241 v1'],
//   // '20230914 AEM 2241 Bonds and Bond Valuation II  HANDOUT': ['AEM 2241 20230914 AEM 2241 Bonds and Bond Valuation II  HANDOUT'],
//   // '20230914 In-class notes': ['AEM 2241 20230914 In-class notes'],
//   // '20230918 AEM 2241 Stock Valuation HANDOUT (1)': ['AEM 2241 20230918 AEM 2241 Stock Valuation HANDOUT (1)'],
//   // '20230919 In-class notes': ['AEM 2241 20230919 In-class notes'],
//   // '20230921 In-class notes': ['AEM 2241 20230921 In-class notes'],
//   // '20230922 AEM 2241 Syllabus': ['AEM 2241 20230922 AEM 2241 Syllabus'],
//   // '20231002 AEM 2241 NPV and Other Investment Criteria - HANDOUT (1)': ['AEM 2241 20231002 AEM 2241 NPV and Other Investment Criteria - HANDOUT (1)'],
//   // '20231012 In-class notes': ['AEM 2241 20231012 In-class notes'],
//   // '20231017 AEM 2241 Making Capital Investment Decisions - HANDOUT': ['AEM 2241 20231017 AEM 2241 Making Capital Investment Decisions - HANDOUT'],
//   // '20231017 In-class notes': ['AEM 2241 20231017 In-class notes'],
//   // '20231023 AEM 2241 Formula sheet': ['AEM 2241 20231023 AEM 2241 Formula sheet'],
//   // '20231023 AEM 2241 v2 SOLUTIONS': ['AEM 2241 20231023 AEM 2241 v2 SOLUTIONS'],
//   // '20231023 AEM 2241 v2': ['AEM 2241 20231023 AEM 2241 v2'],
//   // '20231023 EXPLANATIONS': ['AEM 2241 20231023 EXPLANATIONS'],
//   // '20231025 AEM 2241 Project Analysis and Evaluation HANDOUT': ['AEM 2241 20231025 AEM 2241 Project Analysis and Evaluation HANDOUT'],
//   // '20231106 AEM 2241 Risk, Return, and the SML I & II - SLIDES': ['AEM 2241 20231106 AEM 2241 Risk, Return, and the SML I & II - SLIDES'],
//   // '20231120 AEM 2241 Cost of Capital - HANDOUT': ['AEM 2241 20231120 AEM 2241 Cost of Capital - HANDOUT'],
//   // '20231201 AEM 2241 Formula sheet': ['AEM 2241 20231201 AEM 2241 Formula sheet'],
//   // '20231201 AEM 2241 v3 SOLUTIONS': ['AEM 2241 20231201 AEM 2241 v3 SOLUTIONS'],
//   // '20231201 AEM 2241 v3': ['AEM 2241 20231201 AEM 2241 v3'],
//   // 'AEM 2241 - P2 Solutions': ['AEM 2241 - P2 Solutions'],
//   // 'AEM 2241 P1 solutions': ['AEM 2241 P1 solutions']

//     // PUBPOL
//     'Disparities_2023': ['PUBPOL_2350 Disparities_2023'],
//     'International Comparisons_2023': ['PUBPOL_2350 International Comparisons_2023'],
//     'International Comparisons_Part_2_2023': ['PUBPOL_2350 International Comparisons_Part_2_2023'],
//     'Malpractice_2023': ['PUBPOL_2350 Malpractice_2023'],
//     'Pharma and Biotech_Management_2023': ['PUBPOL_2350 Pharma and Biotech_Management_2023'],
//     'Pharma and Biotech_Policy_2023': ['PUBPOL_2350 Pharma and Biotech_Policy_2023'],
//     'Pharma and Biotech_Policy_Part_2_2023': ['PUBPOL_2350 Pharma and Biotech_Policy_Part_2_2023'],
//     'Quality_2023': ['PUBPOL_2350 Quality_2023'],
//     'Reform_Alternative_2023': ['PUBPOL_2350 Reform_Alternative_2023'],

//       // INFO 2950
//       'FA23_Midterm_QuestionSheet': ['INFO 2950 FA23_Midterm_QuestionSheet'],
//       'Final Fall 2023 - Review Topics': ['INFO 2950 Final Fall 2023 - Review Topics'],
//       'INFO 2950 Fall 2022 Midterm Solutions': ['INFO 2950 INFO 2950 Fall 2022 Midterm Solutions'],
//       'INFO 2950 Final Fall 2022 questions': ['INFO 2950 INFO 2950 Final Fall 2022 questions'],
//       'INFO2950_FA22_MidtermQuestions': ['INFO 2950 INFO2950_FA22_MidtermQuestions'],
//       'INFO2950_Koenecke_Syllabus': ['INFO 2950 INFO2950_Koenecke_Syllabus'],
//       'INFO2950_Lec1_20230821': ['INFO 2950 INFO2950_Lec1_20230821'],
//       'INFO2950_Lec2_20230823': ['INFO 2950 INFO2950_Lec2_20230823'],
//       'INFO2950_Lec3_20230828': ['INFO 2950 INFO2950_Lec3_20230828'],
//       'INFO2950_Lec4_20230830': ['INFO 2950 INFO2950_Lec4_20230830'],
//       'INFO2950_Lec5_20230906': ['INFO 2950 INFO2950_Lec5_20230906'],
//       'INFO2950_Lec6_20230911': ['INFO 2950 INFO2950_Lec6_20230911'],
//       'INFO2950_Lec7_20230913': ['INFO 2950 INFO2950_Lec7_20230913'],
//       'INFO2950_Lec8_20230918': ['INFO 2950 INFO2950_Lec8_20230918'],
//       'INFO2950_Lec9_20230920': ['INFO 2950 INFO2950_Lec9_20230920'],
//       'INFO2950_Lec10_20230925': ['INFO 2950 INFO2950_Lec10_20230925'],
//       'INFO2950_Lec11_20230927': ['INFO 2950 INFO2950_Lec11_20230927'],
//       'INFO2950_Lec12_20231004': ['INFO 2950 INFO2950_Lec12_20231004'],
//       'INFO2950_Lec13_20231011': ['INFO 2950 INFO2950_Lec13_20231011'],
//       'INFO2950_Lec14_20231016': ['INFO 2950 INFO2950_Lec14_20231016'],
//       'INFO2950_Lec15_20231018 2': ['INFO 2950 INFO2950_Lec15_20231018 2'],
//       'INFO2950_Lec16_20231023 2': ['INFO 2950 INFO2950_Lec16_20231023 2'],
//       'INFO2950_Lec17_20231025 2': ['INFO 2950 INFO2950_Lec17_20231025 2'],
//       'INFO2950_Lec18_20231030': ['INFO 2950 INFO2950_Lec18_20231030'],
//       'INFO2950_Lec19_20231101': ['INFO 2950 INFO2950_Lec19_20231101'],
//       'INFO2950_Lec20_20231106': ['INFO 2950 INFO2950_Lec20_20231106'],
//       'INFO2950_Lec21_20231108': ['INFO 2950 INFO2950_Lec21_20231108'],
//       'INFO2950_Lec22_20231113': ['INFO 2950 INFO2950_Lec22_20231113'],
//       'INFO2950_Lec23_20231115 2': ['INFO 2950 INFO2950_Lec23_20231115 2'],
//       'INFO2950_Lec24_20231120 2': ['INFO 2950 INFO2950_Lec24_20231120 2'],
//       'INFO2950_Lec25_20231127 2': ['INFO 2950 INFO2950_Lec25_20231127 2'],
//       'INFO2950_Lec26_20231129 2': ['INFO 2950 INFO2950_Lec26_20231129 2'],
//       'INFO2950_Lec27_20231204 2': ['INFO 2950 INFO2950_Lec27_20231204 2'],
//       'INFO2950-Handbook': ['INFO 2950 INFO2950-Handbook'],
//       'Lec 20 clarification examples 20231106': ['INFO 2950 Lec 20 clarification examples 20231106'],
//       'Lec10_ChalkboardExample_20230925': ['INFO 2950 Lec10_ChalkboardExample_20230925'],
//       'Midterm Fall 2023 - Review Topics': ['INFO 2950 Midterm Fall 2023 - Review Topics'],
//       'FA23_Midterm_Solutions': ['INFO 2950 FA23_Midterm_Solutions'],


//       // ENTOM 2030
//       'Lecture 2': ['ENTOM 2030 Lecture 2'],
//       'Lecture 3': ['ENTOM 2030 Lecture 3'],
//       'Lecture 4': ['ENTOM 2030 Lecture 4'],
//       'Lecture 5': ['ENTOM 2030 Lecture 5'],
//       'Lecture 6': ['ENTOM 2030 Lecture 6'],
//       'Lecture 7': ['ENTOM 2030 Lecture 7'],
//       'Lecture 8': ['ENTOM 2030 Lecture 8'],
//       'Lecture 9': ['ENTOM 2030 Lecture 9'],
//       'Lecture 10': ['ENTOM 2030 Lecture 10'],
//       'Lecture 11': ['ENTOM 2030 Lecture 11'],
//       'Lecture 12': ['ENTOM 2030 Lecture 12'],
//       'Lecture 13': ['ENTOM 2030 Lecture 13'],
//       'Lecture 14': ['ENTOM 2030 Lecture 14'],
//       'Lecture 15': ['ENTOM 2030 Lecture 15'],
//       'Lecture 16': ['ENTOM 2030 Lecture 16'],
//       'Lecture 17': ['ENTOM 2030 Lecture 17'],
//       'Lecture 18': ['ENTOM 2030 Lecture 18'],
//       'Lecture 19': ['ENTOM 2030 Lecture 19'],
//       'Lecture 20': ['ENTOM 2030 Lecture 20'],
//       'Lecture 21': ['ENTOM 2030 Lecture 21'],
//       'Lecture 22': ['ENTOM 2030 Lecture 22'],
//       'Lecture 24': ['ENTOM 2030 Lecture 24'],
//       'Lecture 25': ['ENTOM 2030 Lecture 25'],
//       'Lecture 26': ['ENTOM 2030 Lecture 26']
      

// };


const PINECONE_NAME_SPACE = "";

export { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE, NAMESPACE_NUMB };
