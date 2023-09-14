export function messageContainsCode(message:any, userMessage:any) {
    const codeKeywords = [
      'Python', 'python', 'PYTHON',
      'Java', 'java', 'JAVA',
      'JavaScript', 'javascript', 'JAVASCRIPT',
      'TypeScript', 'typescript', 'TYPESCRIPT',
      'OCaml', 'ocaml', 'OCAML',
      'SQL', 'sql', 'SQL',
      'Swift', 'swift', 'SWIFT',
      'Perl', 'perl', 'PERL',
      'PHP', 'php', 'PHP',
      'HTML', 'html', 'HTML',
      'C++', 'c++', 'C++',
      'MATLAB', 'matlab', 'MATLAB',
      'C#', 'c#', 'C#',
      'Rust', 'rust', 'RUST',
      'Ruby', 'ruby', 'RUBY',
      'Kotlin', 'kotlin', 'KOTLIN',
      'Scala', 'scala', 'SCALA',
      'Lua', 'lua', 'LUA',
      'Fortran', 'fortran', 'FORTRAN',
      'Haskell', 'haskell', 'HASKELL',
      'Bash', 'bash', 'BASH',
      'Erlang', 'erlang', 'ERLANG',
      'F#', 'f#', 'F#',
      'Clojure', 'clojure', 'CLOJURE',
    ];

    const isQuestionCodeRelated = codeKeywords.some(keyword => message.includes(keyword));
    const isAnswerCodeRelated = codeKeywords.some(keyword => userMessage.includes(keyword));
  
    return isQuestionCodeRelated && isAnswerCodeRelated;
  }

export function transformMessageWithCode(message: any) {
  const codeKeywords = [
    'Python', 'python', 'PYTHON',
    'Java', 'java', 'JAVA',
    'JavaScript', 'javascript', 'JAVASCRIPT',
    'TypeScript', 'typescript', 'TYPESCRIPT',
    'OCaml', 'ocaml', 'OCAML',
    'SQL', 'sql', 'SQL',
    'Swift', 'swift', 'SWIFT',
    'Perl', 'perl', 'PERL',
    'PHP', 'php', 'PHP',
    'HTML', 'html', 'HTML',
    'C++', 'c++', 'C++',
    'MATLAB', 'matlab', 'MATLAB',
    'C#', 'c#', 'C#',
    'Rust', 'rust', 'RUST',
    'Ruby', 'ruby', 'RUBY',
    'Kotlin', 'kotlin', 'KOTLIN',
    'Scala', 'scala', 'SCALA',
    'Lua', 'lua', 'LUA',
    'Fortran', 'fortran', 'FORTRAN',
    'Haskell', 'haskell', 'HASKELL',
    'Bash', 'bash', 'BASH',
    'Erlang', 'erlang', 'ERLANG',
    'F#', 'f#', 'F#',
    'Clojure', 'clojure', 'CLOJURE',
  ];
  
  const segments = message.split('`');

  for (let i = 1; i < segments.length; i += 2) {
    if (codeKeywords.some(keyword => segments[i].includes(keyword))) {
      segments[i] = `\`\`\`\n${segments[i]}\n\`\`\``;
    } else {
      segments[i] = `\`${segments[i]}\``;
    }
  }
  
  return segments.join('');
}

