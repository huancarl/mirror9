export function messageContainsCode(message, userMessage) {
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
      "code", "program"
    ];

    const isQuestionCodeRelated = codeKeywords.some(keyword => message.includes(keyword));
    const isAnswerCodeRelated = codeKeywords.some(keyword => userMessage.includes(keyword));
  
    return isQuestionCodeRelated && isAnswerCodeRelated;
  }

  export function transformMessageWithCode(message) {
    // Split the message into segments based on triple backticks
    const segments = message.split('```');
  
    // Iterate over segments and identify code segments
    const transformedSegments = segments.map((segment, index) => {
      // Code segments are at odd indexes (1, 3, 5, ...)
      if (index % 2 === 1) {
        // This is a code segment, we can process it as needed
        return segment; // No additional wrapping necessary
      } else {
        // This is not a code segment
        return segment; // Non-code segments are left as-is
      }
    });
  
    // Reassemble the message, adding backticks to code segments
    let transformedMessage = '';
    transformedSegments.forEach((segment, index) => {
      if (index % 2 === 1) {
        // Wrap code segments with triple backticks
        transformedMessage += '```' + segment + '```';
      } else {
        transformedMessage += segment;
      }
    });
  
    return transformedMessage;
  }


  

