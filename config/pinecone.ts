/**
 * Change the namespace to the namespace on Pinecone you'd like to store your embeddings.
 */

if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error('Missing Pinecone index name in .env file');
}

const PINECONE_INDEX_NAME = 'cornellgpt';

const NAMESPACE_NUMB: { [key: string]: string[] } = {
  'INFO_2040_Textbook': ['INFO 2040 Textbook'],
  'Math_21a_Review_Sheet': ['Math 21a Review Sheet'],
  'Probability_Cheatsheet_v2.0': ['Probability Cheatsheet v2.0'],

  'INFO2950_Koenecke_Syallbus' : ['INFO 2950 Koenecke Syllabus'],
  'INFO2950_Lec7_20230913' : ['INFO 2950 Lecture 7'],
  'INFO2950-Handbook' : ['INFO 2950 Handbook'],

  'MATH_4710': ["Introduction To Probability"],

  'INFO_2950_Fall_2022_Midterm_Solutions': ['INFO 2950 Fall 2022 Midterm Solutions'],
  'INFO2950_FA22_MidtermQuestions': ['INFO 2950 Fall 2022 Midterm Questions'],
  'INFO2950_Lec1_20230821': ['INFO 2950 Lecture 1'],
  'INFO2950_Lec2_20230823': ['INFO 2950 Lecture 2'],
  'INFO2950_Lec3_20230828': ['INFO 2950 Lecture 3'],
  'INFO2950_Lec4_20230830': ['INFO 2950 Lecture 4'],
  'INFO2950_Lec5_20230906': ['INFO 2950 Lecture 5'],
  'INFO2950_Lec6_20230911': ['INFO 2950 Lecture 6'],
  'INFO2950_Lec8_20230918': ['INFO 2950 Lecture 8'],
  'INFO2950_Lec9_20230920': ['INFO 2950 Lecture 9'],
  'INFO2950_Lec10_20230925': ['INFO 2950 Lecture 10'],
  'INFO2950_Midterm_Fall_2023_Review Topics': ['INFO 2950 Midterm Fall 2023 Review Topics'],


  '1_Course_Logistics_Fall_2023.pdf': ['BIOEE Lecture 1 Course Logistics Fall 2023'],
  '2_Overview.pdf': ['BIOEE Lecture 2 Overview'],
  '3_Origin_of_Earth_Ocean.pdf': ['BIOEE Lecture 3 Origin of Earth Ocean'],
  '4_History_of_Life_in_the_Oceans_2023.pdf': ['BIOEE Lecture 4 History of Life in the Oceans 2023'],
  '5_6_Marine_Geology.pdf': ['BIOEE Lecture 5 6 Marine Geology'],
  '7_8_9_Waves_Tides.pdf': ['BIOEE Lecture 7 8 9 Waves Tides'],
  '10_11_12_Ocean_Circulation.pdf': ['BIOEE Lecture 10 11 12 Ocean Circulation'],
  '13_El_Nino_Other_Oscillations.pdf': ['BIOEE Lecture 13 El Nino Other Oscillations'],
  '15_16_Primary_Production.pdf': ['BIOEE Lecture 15 16 Primary Production'],
  '17_Pelagic_FoodWebs.pdf': ['BIOEE Lecture 17 Pelagic FoodWebs'],
  '18_BioEE1540_Guest_Lecture_2023_COMPLETE.pdf': ['BIOEE Lecture 18 Guest Lecture 2023 COMPLETE'],
  '19_Microbial_Processes.pdf': ['BIOEE Lecture 19 Microbial Processes'],
  '20_21_Rocky_Intertidal_Coral_Reefs_Whales.pdf': ['BIOEE Lecture 20 21 Rocky Intertidal Coral Reefs Whales'],
  '22_23_Marine_Chemistry.pdf': ['BIOEE Lecture 22 23 Marine Chemistry'],
  '25_26_Climate_Change_Science_I_and_II.pdf': ['BIOEE Lecture 25 26 Climate Change Science I and II'],
  '27_Howarth_--_methane_--_Oct_30_2023.pdf': ['BIOEE Lecture 27 Howarth methane Oct 30 2023'],
  '28_Climate_Change_and_Extreme_Weather.pdf': ['BIOEE Lecture 28 Climate Change and Extreme Weather'],
  '30_Howarth_Climate_Solutions_--_Nov_6_2023.pdf': ['BIOEE Lecture 30 Howarth Climate Solutions Nov 6 2023'],
  '31_Cornell_2035_Climate_Action_Plan.pdf': ['BIOEE Lecture 31 Cornell 2035 Climate Action Plan'],
  '32_Marine_Pollution.pdf': ['BIOEE Lecture 32 Marine Pollution'],
  '33_fishing_impacts.pdf': ['BIOEE Lecture 33 Fishing Impacts'],
  '34_Loss_of_Global_Biodiversity.pdf': ['BIOEE Lecture 34 Loss of Global Biodiversity'],
  '35_6th_extinction_in_the_oceans_2023.pdf': ['BIOEE Lecture 35 6th Extinction in the Oceans 2023'],
  

};


const PINECONE_NAME_SPACE = "";

export { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE, NAMESPACE_NUMB };
