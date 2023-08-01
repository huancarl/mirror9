export function extractYearsFromQuery(query: string) {
    // extract name of textbooks from the query and return them as an array using regex

    const pattern: RegExp = /\b(networks|game theory)\b/gi;
    const titles: string[] = [];
    let match;

    while ((match = pattern.exec(query)) !== null) {
      titles.push(match[1]);
    }

    return titles;

  }
  