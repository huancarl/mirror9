/**
 * Change the namespace to the namespace on Pinecone you'd like to store your embeddings.
 */
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error('Missing Pinecone index name in .env file');
}

// const jsonFilePath = path.join('utils', 'pdfNamestoNamespace.json');

// const NAMESPACE_NUMB = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

const PINECONE_INDEX_NAME = 'cornellgpt';

const NAMESPACE_NUMB: { [key: string]: string[] } = {
  //Maps the names of the pdf files to namespace names so that it can be ingested and later retrieved 

  // '2023 Fall AEM 2241 hw1': ['AEM 2241 2023 Fall AEM 2241 hw1'],
  // '2023 Fall AEM 2241 hw2': ['AEM 2241 2023 Fall AEM 2241 hw2'],
  // '2023 Fall AEM 2241 hw3': ['AEM 2241 2023 Fall AEM 2241 hw3'],
  // '2023 Fall AEM 2241 hw4': ['AEM 2241 2023 Fall AEM 2241 hw4'],
  // '20230822 AEM 2241 Time Value of Money - HANDOUT': ['AEM 2241 20230822 AEM 2241 Time Value of Money - HANDOUT'],
  // '20230824 In-class notes': ['AEM 2241 20230824 In-class notes'],
  // '20230828 AEM 2241 Discounted Cash Flow Valuation - HANDOUT (1)': ['AEM 2241 20230828 AEM 2241 Discounted Cash Flow Valuation - HANDOUT (1)'],
  // '20230829 In-class notes': ['AEM 2241 20230829 In-class notes'],
  // '20230830 AEM 2241 Discounted Cash Flow Valuation II HANDOUT': ['AEM 2241 20230830 AEM 2241 Discounted Cash Flow Valuation II HANDOUT'],
  // '20230831 In-class notes': ['AEM 2241 20230831 In-class notes'],
  // '20230905 AEM 2241 Discounted Cash Flow Valuation III HANDOUT': ['AEM 2241 20230905 AEM 2241 Discounted Cash Flow Valuation III HANDOUT'],
  // '20230905 In-class notes': ['AEM 2241 20230905 In-class notes'],
  // '20230907 In-class notes': ['AEM 2241 20230907 In-class notes'],
  // '20230911 AEM 2241 Bonds and Bond Valuation HANDOUT': ['AEM 2241 20230911 AEM 2241 Bonds and Bond Valuation HANDOUT'],
  // '20230912 In-class notes': ['AEM 2241 20230912 In-class notes'],
  // '20230913 AEM 2241 Formula sheet v1 (1)': ['AEM 2241 20230913 AEM 2241 Formula sheet v1 (1)'],
  // '20230913 AEM 2241 v1 SOLUTIONS': ['AEM 2241 20230913 AEM 2241 v1 SOLUTIONS'],
  // '20230913 AEM 2241 v1': ['AEM 2241 20230913 AEM 2241 v1'],
  // '20230914 AEM 2241 Bonds and Bond Valuation II  HANDOUT': ['AEM 2241 20230914 AEM 2241 Bonds and Bond Valuation II  HANDOUT'],
  // '20230914 In-class notes': ['AEM 2241 20230914 In-class notes'],
  // '20230918 AEM 2241 Stock Valuation HANDOUT (1)': ['AEM 2241 20230918 AEM 2241 Stock Valuation HANDOUT (1)'],
  // '20230919 In-class notes': ['AEM 2241 20230919 In-class notes'],
  // '20230921 In-class notes': ['AEM 2241 20230921 In-class notes'],
  // '20230922 AEM 2241 Syllabus': ['AEM 2241 20230922 AEM 2241 Syllabus'],
  // '20231002 AEM 2241 NPV and Other Investment Criteria - HANDOUT (1)': ['AEM 2241 20231002 AEM 2241 NPV and Other Investment Criteria - HANDOUT (1)'],
  // '20231012 In-class notes': ['AEM 2241 20231012 In-class notes'],
  // '20231017 AEM 2241 Making Capital Investment Decisions - HANDOUT': ['AEM 2241 20231017 AEM 2241 Making Capital Investment Decisions - HANDOUT'],
  // '20231017 In-class notes': ['AEM 2241 20231017 In-class notes'],
  // '20231023 AEM 2241 Formula sheet': ['AEM 2241 20231023 AEM 2241 Formula sheet'],
  // '20231023 AEM 2241 v2 SOLUTIONS': ['AEM 2241 20231023 AEM 2241 v2 SOLUTIONS'],
  // '20231023 AEM 2241 v2': ['AEM 2241 20231023 AEM 2241 v2'],
  // '20231023 EXPLANATIONS': ['AEM 2241 20231023 EXPLANATIONS'],
  // '20231025 AEM 2241 Project Analysis and Evaluation HANDOUT': ['AEM 2241 20231025 AEM 2241 Project Analysis and Evaluation HANDOUT'],
  // '20231106 AEM 2241 Risk, Return, and the SML I & II - SLIDES': ['AEM 2241 20231106 AEM 2241 Risk, Return, and the SML I & II - SLIDES'],
  // '20231120 AEM 2241 Cost of Capital - HANDOUT': ['AEM 2241 20231120 AEM 2241 Cost of Capital - HANDOUT'],
  // '20231201 AEM 2241 Formula sheet': ['AEM 2241 20231201 AEM 2241 Formula sheet'],
  // '20231201 AEM 2241 v3 SOLUTIONS': ['AEM 2241 20231201 AEM 2241 v3 SOLUTIONS'],
  // '20231201 AEM 2241 v3': ['AEM 2241 20231201 AEM 2241 v3'],
  // 'AEM 2241 - P2 Solutions': ['AEM 2241 - P2 Solutions'],
  // 'AEM 2241 P1 solutions': ['AEM 2241 P1 solutions']


    'Disparities_2023': ['PUBPOL_2350 Disparities_2023'],
    'International Comparisons_2023': ['PUBPOL_2350 International Comparisons_2023'],
    'International Comparisons_Part_2_2023': ['PUBPOL_2350 International Comparisons_Part_2_2023'],
    'Malpractice_2023': ['PUBPOL_2350 Malpractice_2023'],
    'Pharma and Biotech_Management_2023': ['PUBPOL_2350 Pharma and Biotech_Management_2023'],
    'Pharma and Biotech_Policy_2023': ['PUBPOL_2350 Pharma and Biotech_Policy_2023'],
    'Pharma and Biotech_Policy_Part_2_2023': ['PUBPOL_2350 Pharma and Biotech_Policy_Part_2_2023'],
    'Quality_2023': ['PUBPOL_2350 Quality_2023'],
    'Reform_Alternative_2023': ['PUBPOL_2350 Reform_Alternative_2023']
    

};


const PINECONE_NAME_SPACE = "";

export { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE, NAMESPACE_NUMB };
