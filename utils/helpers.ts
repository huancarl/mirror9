export function extractTitlesFromQuery(query: string) {
    // extract name of textbooks from the query and return them as an array using regex
  
    const pattern: RegExp = 
    /\b(Networks|Probability Cheatsheet v2.0|Harvard: Math 21a Review Sheet|INFO 2950 Student Handbook| Introduction To Probability| FA23_INFO2950_Koenecke_Syllabus | INFO2950_Lecture 7| )\b/gi;
      const titles: string[] = [];
      const titlesMap: Record<string, string> = {
          "networks": "Networks",
          'probability cheatsheet v2.0': 'Probability Cheatsheet v2.0',
          "harvard: math 21a review sheet": "Harvard: Math 21a Review Sheet", // o(n) -- carl huangie
          "info 2950 student handbook" : "INFO 2950 Student Handbook",
          "fa23_info2950_koenecke_syallbus": 'FA23_INFO2950_Koenecke_Syllabus',
          "info2950_lecture 7": 'INFO2950_Lecture 7',
          "introduction to probability": "Introduction To Probability",
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
    
  
  