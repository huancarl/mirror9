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
  
    //const pattern: RegExp = /\b(INFO 2040 Textbook|Probability Cheatsheet v2.0|Math 21a Review Sheet|INFO 2950 Koenecke Syllabus|INFO 2950 Lecture 7|INFO 2950 Handbook|Introduction To Probability|INFO 2950 Fall 2022 Midterm Solutions|INFO 2950 Fall 2022 Midterm Questions|INFO 2950 Lecture 1|INFO 2950 Lecture 2|INFO 2950 Lecture 3|INFO 2950 Lecture 4|INFO 2950 Lecture 5|INFO 2950 Lecture 6|INFO 2950 Lecture 8|INFO 2950 Lecture 9|INFO 2950 Lecture 10|INFO 2950 Midterm Fall 2023 Review Topics|BIOEE Lecture 1 Course Logistics Fall 2023|BIOEE Lecture 2 Overview|BIOEE Lecture 3 Origin of Earth Ocean|BIOEE Lecture 4 History of Life in the Oceans 2023|BIOEE Lecture 5 6 Marine Geology|BIOEE Lecture 7 8 9 Waves Tides|BIOEE Lecture 10 11 12 Ocean Circulation|BIOEE Lecture 13 El Nino Other Oscillations|BIOEE Lecture 15 16 Primary Production|BIOEE Lecture 17 Pelagic FoodWebs|BIOEE Lecture 18 Guest Lecture 2023 COMPLETE|BIOEE Lecture 19 Microbial Processes|BIOEE Lecture 20 21 Rocky Intertidal Coral Reefs Whales|BIOEE Lecture 22 23 Marine Chemistry|BIOEE Lecture 25 26 Climate Change Science I and II|BIOEE Lecture 27 Howarth methane Oct 30 2023|BIOEE Lecture 28 Climate Change and Extreme Weather|BIOEE Lecture 30 Howarth Climate Solutions Nov 6 2023|BIOEE Lecture 31 Cornell 2035 Climate Action Plan|BIOEE Lecture 32 Marine Pollution|BIOEE Lecture 33 Fishing Impacts|BIOEE Lecture 34 Loss of Global Biodiversity|BIOEE Lecture 35 6th Extinction in the Oceans 2023)\b/gi;
    const pattern = await loadPattern();
    const titlesMap = await loadTitlesMap();

    // const pattern: RegExp = 
    // /\b(INFO 2040 Textbook|Probability Cheatsheet v2.0|Math 21a Review Sheet|INFO 2950 Koenecke Syllabus|INFO 2950 Lecture 7|INFO 2950 Handbook|Introduction To Probability|INFO 2950 Fall 2022 Midterm Solutions|INFO 2950 Fall 2022 Midterm Questions|INFO 2950 Lecture 1|INFO 2950 Lecture 2|INFO 2950 Lecture 3|INFO 2950 Lecture 4|INFO 2950 Lecture 5|INFO 2950 Lecture 6|INFO 2950 Lecture 8|INFO 2950 Lecture 9|INFO 2950 Lecture 10|INFO 2950 Midterm Fall 2023 Review Topics)\b/gi;
      const titles: string[] = [];
    

      // const titlesMap: Record<string, string> = {
        
      //   "info 2040 textbook": "INFO 2040 Textbook",
      //   'probability cheatsheet v2.0': 'Probability Cheatsheet v2.0',
      //   "math 21a review sheet": "Math 21a Review Sheet",  
    
      //   "info 2950 koenecke syllabus": "INFO 2950 Koenecke Syllabus",
      //   "info 2950 lecture 7": 'INFO 2950 Lecture 7',
      //   "info 2950 handbook": 'INFO 2950 Handbook',
      //   "introduction to probability": "Introduction To Probability",
    
      //   "info 2950 fall 2022 midterm solutions": 'INFO 2950 Fall 2022 Midterm Solutions',
      //   "info 2950 fall 2022 midterm questions": 'INFO 2950 Fall 2022 Midterm Questions',
      //   "info 2950 lecture 1": 'INFO 2950 Lecture 1',
      //   "info 2950 lecture 2": 'INFO 2950 Lecture 2',
      //   "info 2950 lecture 3": 'INFO 2950 Lecture 3',
      //   "info 2950 lecture 4": 'INFO 2950 Lecture 4',
      //   "info 2950 lecture 5": 'INFO 2950 Lecture 5',
      //   "info 2950 lecture 6": 'INFO 2950 Lecture 6',
      //   "info 2950 lecture 8": 'INFO 2950 Lecture 8',
      //   "info 2950 lecture 9": 'INFO 2950 Lecture 9',
      //   "info 2950 lecture 10": 'INFO 2950 Lecture 10',
      //   "info 2950 midterm fall 2023 review topics": 'INFO 2950 Midterm Fall 2023 Review Topics',

      //   "bioee lecture 1 course logistics fall 2023": "BIOEE Lecture 1 Course Logistics Fall 2023",
      //   "bioee lecture 2 overview": "BIOEE Lecture 2 Overview",
      //   "bioee lecture 3 origin of earth ocean": "BIOEE Lecture 3 Origin of Earth Ocean",
      //   "bioee lecture 4 history of life in the oceans 2023": "BIOEE Lecture 4 History of Life in the Oceans 2023",
      //   "bioee lecture 5 6 marine geology": "BIOEE Lecture 5 6 Marine Geology",
      //   "bioee lecture 7 8 9 waves tides": "BIOEE Lecture 7 8 9 Waves Tides",
      //   "bioee lecture 10 11 12 ocean circulation": "BIOEE Lecture 10 11 12 Ocean Circulation",
      //   "bioee lecture 13 el nino other oscillations": "BIOEE Lecture 13 El Nino Other Oscillations",
      //   "bioee lecture 15 16 primary production": "BIOEE Lecture 15 16 Primary Production",
      //   "bioee lecture 17 pelagic foodwebs": "BIOEE Lecture 17 Pelagic FoodWebs",
      //   "bioee lecture 18 guest lecture 2023 complete": "BIOEE Lecture 18 Guest Lecture 2023 COMPLETE",
      //   "bioee lecture 19 microbial processes": "BIOEE Lecture 19 Microbial Processes",
      //   "bioee lecture 20 21 rocky intertidal coral reefs whales": "BIOEE Lecture 20 21 Rocky Intertidal Coral Reefs Whales",
      //   "bioee lecture 22 23 marine chemistry": "BIOEE Lecture 22 23 Marine Chemistry",
      //   "bioee lecture 25 26 climate change science i and ii": "BIOEE Lecture 25 26 Climate Change Science I and II",
      //   "bioee lecture 27 howarth methane oct 30 2023": "BIOEE Lecture 27 Howarth methane Oct 30 2023",
      //   "bioee lecture 28 climate change and extreme weather": "BIOEE Lecture 28 Climate Change and Extreme Weather",
      //   "bioee lecture 30 howarth climate solutions nov 6 2023": "BIOEE Lecture 30 Howarth Climate Solutions Nov 6 2023",
      //   "bioee lecture 31 cornell 2035 climate action plan": "BIOEE Lecture 31 Cornell 2035 Climate Action Plan",
      //   "bioee lecture 32 marine pollution": "BIOEE Lecture 32 Marine Pollution",
      //   "bioee lecture 33 fishing impacts": "BIOEE Lecture 33 Fishing Impacts",
      //   "bioee lecture 34 loss of global biodiversity": "BIOEE Lecture 34 Loss of Global Biodiversity",
      //   "bioee lecture 35 6th extinction in the oceans 2023": "BIOEE Lecture 35 6th Extinction in the Oceans 2023",
      // };
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
    
  
  