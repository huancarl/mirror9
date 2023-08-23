export function extractTitlesFromQuery(query: string) {
  // extract name of textbooks from the query and return them as an array using regex

  const pattern: RegExp = /\b(Networks|Probability Cheatsheet v2.0|Harvard: Math 21a Review Sheet|INFO 2950 Syllabus)\b/gi;
    const titles: string[] = [];
    const titlesMap: Record<string, string> = {
        "networks": "Networks",
        'probability cheatsheet v2.0': 'Probability Cheatsheet v2.0',
        "harvard: math 21a review sheet": "Harvard: Math 21a Review Sheet", // o(n) -- carl huangie
        "info 2950 syllabus" : "INFO 2950 Syllabus"
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
  