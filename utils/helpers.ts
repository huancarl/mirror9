export function extractTitlesFromQuery(query: string) {
    // extract name of textbooks from the query and return them as an array using regex
  
    const pattern: RegExp = 
    /\b(INFO 2040 Textbook|Probability Cheatsheet v2.0|Math 21a Review Sheet|INFO 2950 Koenecke Syllabus|INFO 2950 Lecture 7|INFO 2950 Handbook|Introduction To Probability|INFO 2950 Fall 2022 Midterm Solutions|INFO 2950 Fall 2022 Midterm Questions|INFO 2950 Lecture 1|INFO 2950 Lecture 2|INFO 2950 Lecture 3|INFO 2950 Lecture 4|INFO 2950 Lecture 5|INFO 2950 Lecture 6|INFO 2950 Lecture 8|INFO 2950 Lecture 9|INFO 2950 Lecture 10|INFO 2950 Midterm Fall 2023 Review Topics)\b/gi;
      const titles: string[] = [];
      const titlesMap: Record<string, string> = {
        
        "info 2040 textbook": "INFO 2040 Textbook",
        'probability cheatsheet v2.0': 'Probability Cheatsheet v2.0',
        "math 21a review sheet": "Math 21a Review Sheet",  
    
        "info 2950 koenecke syllabus": "INFO 2950 Koenecke Syllabus",
        "info 2950 lecture 7": 'INFO 2950 Lecture 7',
        "info 2950 handbook": 'INFO 2950 Handbook',
        "introduction to probability": "Introduction To Probability",
    
        "info 2950 fall 2022 midterm solutions": 'INFO 2950 Fall 2022 Midterm Solutions',
        "info 2950 fall 2022 midterm questions": 'INFO 2950 Fall 2022 Midterm Questions',
        "info 2950 lecture 1": 'INFO 2950 Lecture 1',
        "info 2950 lecture 2": 'INFO 2950 Lecture 2',
        "info 2950 lecture 3": 'INFO 2950 Lecture 3',
        "info 2950 lecture 4": 'INFO 2950 Lecture 4',
        "info 2950 lecture 5": 'INFO 2950 Lecture 5',
        "info 2950 lecture 6": 'INFO 2950 Lecture 6',
        "info 2950 lecture 8": 'INFO 2950 Lecture 8',
        "info 2950 lecture 9": 'INFO 2950 Lecture 9',
        "info 2950 lecture 10": 'INFO 2950 Lecture 10',
        "info 2950 midterm fall 2023 review topics": 'INFO 2950 Midterm Fall 2023 Review Topics'
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
    
  
  