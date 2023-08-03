export function extractTitlesFromQuery(query: string) {
  // extract name of textbooks from the query and return them as an array using regex

  const pattern: RegExp = /\b(Networks|Game Theory|Probability & Markets)\b/gi;
    const titles: string[] = [];
    const titlesMap: Record<string, string> = {
        "networks": "Networks",
        "game theory": "Game Theory",
        "probability & markets": "Probability & Markets"
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
  