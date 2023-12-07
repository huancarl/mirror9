import { Json } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch';
import axios from 'axios';
import { promises as fs } from 'fs';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { pinecone } from '@/utils/pinecone-client';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { PINECONE_INDEX_NAME, NAMESPACE_NUMB } from '@/config/pinecone';
import { OpenAIApi, Configuration } from "openai";
import { AnyARecord } from 'dns';

const courseMapping: { [code: string]: string } = {
  "D-AG": "College of Agriculture and Life Sciences: Human Diversity",
  "CA-AG": "College of Agriculture and Life Sciences: Cultural Analysis",
  "HA-AG": "College of Agriculture and Life Sciences: Historical Analysis",
  "KCM-AG": "College of Agriculture and Life Sciences: Knowledge Cognition and Moral Reasoning",
  "LA-AG": "College of Agriculture and Life Sciences: Literature and the Arts",
  "SBA-AG": "College of Agriculture and Life Sciences: Social and Behavioral Analysis",
  "BIO-AG": "College of Agriculture and Life Sciences: Introductory Life Sciences/Biology Requirement for Biology majors",
  "BIOLS-AG": "College of Agriculture and Life Sciences: Introductory Life Sciences/Biology Requirement for Life Sciences majors",
  "BIONLS-AG": "College of Agriculture and Life Sciences: Introductory Life Sciences/Biology Requirement for Non-Life Sciences majors",
  "OPHLS-AG": "College of Agriculture and Life Sciences: Other Physical and Life Sciences Requirement",
  "PBS-AAP": "College of Architecture, Art, and Planning: Physical and Biological Sciences",
  "MQR-AAP": "College of Architecture, Art, and Planning: Mathematics and Quantitative Reasoning",
  "CA-AAP": "College of Architecture, Art, and Planning: Cultural Analysis",
  "FL-AAP": "College of Architecture, Art, and Planning: Foreign Language",
  "HA-AAP": "College of Architecture, Art, and Planning: Historical Analysis",
  "KCM-AAP": "College of Architecture, Art, and Planning: Knowledge Cognition and Moral Reasoning",
  "LA-AAP": "College of Architecture, Art, and Planning: Literature and the Arts",
  "SBA-AAP": "College of Architecture, Art, and Planning: Social and Behavioral Analysis",
  "PBS-AS": "College of Arts and Sciences: Physical and Biological Sciences",
  "PBSS-AS": "College of Arts and Sciences: Physical and Biological Sciences",
  "MQR-AS": "College of Arts and Sciences: Mathematics and Quantitative Reasoning",
  "CA-AS": "College of Arts and Sciences: Cultural Analysis",
  "HA-AS": "College of Arts and Sciences: Historical Analysis",
  "KCM-AS": "College of Arts and Sciences: Knowledge, Cognition, and Moral Reasoning",
  "LA-AS": "College of Arts and Sciences: Literature and the Arts",
  "SBA-AS": "College of Arts and Sciences: Social and Behavioral Analysis",
  "CE-EN": "College of Engineering: Communications in Engineering",
  "PBS-HE": "College of Human Ecology: Physical and Biological Sciences",
  "MQR-HE": "College of Human Ecology: Statistics and Calculus",
  "D-HE": "College of Human Ecology: Human Diversity",
  "CA-HE": "College of Human Ecology: Cultural Analysis",
  "HA-HE": "College of Human Ecology: Historical Analysis",
  "KCM-HE": "College of Human Ecology: Knowledge, Cognition, and Moral Reasoning",
  "LAD-HE": "College of Human Ecology: Literature, the Arts and Design",
  "SBA-HE": "College of Human Ecology: Social and Behavioral Analysis"
};

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is set in environment variables
});
//const openai = new OpenAIApi(configuration);

const fetchSubjects = async (roster: string,) => {
  //fetches list of all subjects given a semester
  try{
    const response = await axios.get(`https://classes.cornell.edu/api/2.0/config/subjects.json?`, {
        params: {
          roster,
        },
      });

    return response.data.data.subjects;
  }
  catch (error){
    console.log('An error occured while fetching subjects');
  }
}

function convertStringToList(str: string): string[] {
  // Remove the parentheses
  const cleanedString = str.replace(/[()]/g, '');

  // Split the string by comma
  const list = cleanedString.split(', ');

  return list;
}


function countTokens(text: string): number {
  // Simple word count as a proxy for tokens. This is an approximation.
  return text.split(/\s+/).length;
}

function splitIntoChunks(text: string, chunkSize: number): string[] {
  const words = text.split(/\s+/);
  let currentChunk: string[] = [];
  let chunks: string[] = [];
  let currentCount = 0;

  for (let word of words) {
      currentChunk.push(word);
      currentCount++;

      if (currentCount >= chunkSize) {
          chunks.push(currentChunk.join(' '));
          currentChunk = [];
          currentCount = 0;
      }
  }

  if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

const CHUNK_SIZE = 225; // Set your OpenAI token limit
const indexToIngest = pinecone.Index(PINECONE_INDEX_NAME);
const namespaceToIngest = 'Course Catalog';

const ingestClassesForSubject = async (roster: string, subject: string,) => {
    //Gets a response from the Cornell API containing all classes for a subject. Then we parse the data and
    //create vectors on pinecone
    try {
      const response = await axios.get(`https://classes.cornell.edu/api/2.0/search/classes.json?`, {
        params: {
          roster,
          subject,
        },
      });
  
      //console.log(response.data.data.classes);
      //Get all of the classes that exist for parameter subject
      const classes = response.data.data.classes;
      // let allClassInfo: string[] = [];
      //For each class format the information to prepare for ingestion
      for(let i = 0; i < classes.length; i++){

        const classInfoStr = await formatInfoForClass(classes[i]);
        const chunks = splitIntoChunks(classInfoStr, CHUNK_SIZE);
    
        for (const [index, chunk] of chunks.entries()) {

          console.log(chunk, 'chunk');
          const json = JSON.stringify(chunk);
          await fs.appendFile('classes-split.json', json + '\n');

          const embeddings = new OpenAIEmbeddings(/* configuration */);
          const dbConfig = {
            pineconeIndex: indexToIngest,
            namespace: namespaceToIngest,
            textKey: 'text'
          };
    
          let metadata = {
            courseId: classes[i].crseId,
            title: classes[i].titleLong,
            subject: classes[i].subject,
            part: index
            // Removed prevVector and nextVector
          };
    
        await PineconeStore.fromTexts([chunk], metadata, embeddings, dbConfig);  





        // const classInfoStr = await formatInfoForClass(classes[i]);
        // console.log(classInfoStr);

        // const json = JSON.stringify(classInfoStr);
        // await fs.appendFile('classes-split.json', json + '\n');
        // allClassInfo.push(classInfoStr);  

        // let chunks;
        // if (countTokens(classInfoStr) > TOKEN_LIMIT) {
        //   chunks = splitIntoChunks(classInfoStr, TOKEN_LIMIT); // Implement this function
        // } else {
        //   chunks = [classInfoStr]; // Keep as a single chunk
        // }

        // let prevVectorId: string | null = null;

        // for (const [index, chunk] of chunks.entries()) {
        //   const vectorId = `${classes[i].crseId}_${index}`;
        //   const embeddings = new OpenAIEmbeddings(/* configuration */);
        //   const dbConfig = {
        //     pineconeIndex: indexToIngest,
        //     namespace: namespaceToIngest,
        //     textKey: 'text'
        //   };

        //   let metadata = {
        //     courseId: classes[i].crseId,
        //     title: classes[i].titleLong,
        //     subject: classes[i].subject,
        //     part: index,
        //     prevVector: prevVectorId,
        //     nextVector: index < chunks.length - 1 ? `${classes[i].crseId}_${index + 1}` : null
        //   };

        //   prevVectorId = vectorId;
        //   await PineconeStore.fromTexts([chunk], metadata, embeddings, dbConfig);
        // }
        }
      }
    } catch (error) {
      console.error('Error ingesting class data:', error);
    }
};

async function formatEnrollGroups(enrollGroupObj: any): Promise<string> {

  //Enroll groups are groups of lectures/labs that the users can enroll in. This function gets all of
  // The information for each. Returns it as a string to vectorize.

  let enrollGroupsStr = 'Information For All Enrollment Groups For This Class. ';
  const allGroups = enrollGroupObj;
  //For each enrollment group of a class
  for(let i = 0; i < allGroups.length; i++){

    let currGroup = '';
    const classType = allGroups[i].classSections[0].ssrComponentLong;
    const sectionNum = allGroups[i].classSections[0].section;
    const addConsent = allGroups[i].classSections[0].addConsentDescr;
    const instructionMode = allGroups[i].classSections[0].instrModeDescr;
    const grading = allGroups[i].gradingBasisLong;
    let note='';
    if(allGroups[i].classSections[0].notes[0]){
      note += allGroups[i].classSections[0].notes[0].descrlong;
    }
    const sessionLength = allGroups[i].sessionLong;

    currGroup += `The following is the information for an enrollment group number ${i+1} for this class: This enrollment group is of type ${classType}. The enrollment group's
    section number is ${sectionNum}. Class adding consent comment: ${addConsent}. Instruction mode: ${instructionMode}.
    Notes for this enrollment group: ${note}. Its grading options are/is ${grading}. This enrollment group's session length is ${sessionLength}.`;

    //Iterate through all of the meetings array to get meeting information which also contains info on professor. For each meeting...

    let meetingInfo = ` Meeting information for this enrollment group: `;
    for(let j = 0; j < allGroups[i].classSections[0].meetings.length; j++){

      const startTime = allGroups[i].classSections[0].meetings[j].timeStart;
      const endTime = allGroups[i].classSections[0].meetings[j].timeEnd;

      const startDate = allGroups[i].classSections[0].meetings[j].startDt;
      const endDate = allGroups[i].classSections[0].meetings[j].endDt;

      meetingInfo += `Starting Time: ${startTime}. Ending Time: ${endTime}. Starting Date: ${startDate}. Ending Date: ${endDate}. `;

      let instructorsInfo = 'Instructor information for this meeting: ';

      for(let k = 0; k < allGroups[i].classSections[0].meetings[j].instructors.length; k++){

        const instructorFirstName = allGroups[i].classSections[0].meetings[j].instructors[k].firstName;
        const instructorMidName = allGroups[i].classSections[0].meetings[j].instructors[k].middleName;
        const instructorLastName = allGroups[i].classSections[0].meetings[j].instructors[k].lastName;

        instructorsInfo += `Instructor Number ${k+1}: ${instructorFirstName} ${instructorMidName} ${instructorLastName}. `; 
      }

      meetingInfo += `Instructor Information: ${instructorsInfo}`
    }
    currGroup += meetingInfo;
    enrollGroupsStr += currGroup;
  }
  return enrollGroupsStr;
}

async function formatInfoForClass(course: any): Promise<string> {
  //Helper function that formats all of the class information into a string for the vectorizer.

  //formats the data for enroll groups

  const enrollGroupInfo = await formatEnrollGroups(course.enrollGroups);

  //format data for distribution requirments by mapping the codes to actually understandable shit:  
  const distributionCode = course.catalogDistr;
  let distributions = '';
  if(distributionCode !== "" && distributionCode){
    const listOFDistributions = convertStringToList(distributionCode);
    for(let i = 0; i < listOFDistributions.length; i++){
      
      distributions += courseMapping[listOFDistributions[i]];

    }
  }

  //formats data for course outcomes
  const outcomes = course.catalogOutcomes;
  let outcomeComments = '';
  if(outcomes){
    for(let i = 0; i < outcomes.length; i++){
      outcomeComments += outcomes[i];
    }
  }

  //Text containing the information for the class. Will be vectorized.
  let combinedText = `Subject: ${course.subject}. Course number: ${course.catalogNbr}. Title of course: ${course.titleLong}. \
  Course Description: ${course.description}. Class Breadth: ${course.catalogBreadth}. Class Distributions: ${course.catalogDistr}.\
  Class Forbidden Overlaps: ${course.catalogForbiddenOverlaps}. Class Attributes: ${course.catalogAttribute}. \
  When Is The Class Offered: ${course.catalogWhenOffered} Class Comments: ${course.catalogComments}. \
  Class Prerequisites And Corequisites: ${course.catalogPrereqCoreq} Class Fee: ${course.catalogFee}. \
  Class Satisfies Requirement: ${course.catalogSatisfiesReq}. Class Permission: ${course.catalogPermission} \
  Class Academic Group: ${course.acadGroup}. Offered: ${course.catalogWhenOffered}, Overlaps: ${course.catalogForbiddenOverlaps}. \
  Distributions For This Class: ${distributions}. Class outcomes: ${outcomeComments}. ${enrollGroupInfo}`;

  // console.log(combinedText);
  // console.log('\n');

  return combinedText;
}

export const run = async () => {
  try {
    const semesterYear = 'SP24';
    const subjectList = await fetchSubjects(semesterYear);

    //Use this to get all of the subjects for a roster year
    //console.log(subjectList); 

    for(let i = 0; i < subjectList.length; i++){
      await ingestClassesForSubject(semesterYear, subjectList[i].value)
    }

  } catch (error) {
    console.error('Failed to ingest your data', error);
  }
};

(async () => {
  await run();
})();