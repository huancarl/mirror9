export function extractTitlesFromQuery(query: string) {
    // extract name of textbooks from the query and return them as an array using regex
  
    const pattern: RegExp = 
    /\b(INFO 2040 Textbook|Probability Cheatsheet v2.0|Math 21a Review Sheet|INFO 2950 Student Handbook|Introduction To Probability|INFO 2950 Koenecke Syllabus|INFO 2950 Lecture 7|INFO 2950 Handbook)\b/gi;
      const titles: string[] = [];
      const titlesMap: Record<string, string> = {
        
          "info 2040 textbook": "INFO 2040 Textbook",
          'probability cheatsheet v2.0': 'Probability Cheatsheet v2.0',
          "math 21a review sheet": "Math 21a Review Sheet", // o(n) -- carl huangie

          "info 2950 koenecke syllabus" : "INFO 2950 Koenecke Syllabus",
          "info 2950 lecture 7": 'INFO 2950 Lecture 7',
          "info 2950 handbook": 'INFO 2950 Handbook',


          "introduction to probability": "Introduction To Probability"
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
    
  
  