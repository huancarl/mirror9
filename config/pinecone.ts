/**
 * Change the namespace to the namespace on Pinecone you'd like to store your embeddings.
 */

if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error('Missing Pinecone index name in .env file');
}

const PINECONE_INDEX_NAME = 'mithgpt';

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
  'INFO2950_Midterm_Fall_2023_Review Topics': ['INFO 2950 Midterm Fall 2023 Review Topics']
};


const PINECONE_NAME_SPACE = "";

export { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE, NAMESPACE_NUMB };
