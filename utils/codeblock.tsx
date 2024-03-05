export function messageContainsCode(message) {
  // Check if the message contains triple backticks
  return message.includes('```');
}



// export function transformMessageWithCode(message) {
//   const tripleBacktickSegments = message.split('```');

//   return tripleBacktickSegments.map((segment, index) => {
//     if (index % 2 === 1) {
//       // This is a code block segment
//       return (
//         <div key={index} className="codeSegmentContainer">
//           <pre><code>{segment}</code></pre>
//         </div>
//       );
//     } else {
//       // This is a non-code block segment, handle inline code snippets
//       const inlineCodeSegments = segment.split(/(`.*?`)/);
//       return inlineCodeSegments.map((inlineSegment, inlineIndex) => {
//         if (inlineSegment.startsWith('`') && inlineSegment.endsWith('`')) {
//           // This is an inline code snippet
//           return (
//             <code key={'inline' + inlineIndex}>
//               {inlineSegment.substring(1, inlineSegment.length - 1)}
//             </code>
//           );
//         } else {
//           // This is regular text
//           return <span key={'text' + inlineIndex}>{inlineSegment}</span>;
//         }
//       });
//     }
//   });
// }
export function transformMessageWithCode(message) {
  const tripleBacktickSegments = message.split('```');

  return tripleBacktickSegments.flatMap((segment, index) => {
    if (index % 2 === 1) {
      // This is a code block segment
      return (
        <div key={'code-block-' + index} className="codeSegmentContainer">
          <pre><code>{segment}</code></pre>
        </div>
      );
    } else {
      // This is a non-code block segment
      // First, handle inline code snippets
      const inlineCodeSegments = segment.split(/(`.*?`)/);

      // Then, for each segment, parse for bold text and links
      return inlineCodeSegments.flatMap((inlineSegment, inlineIndex) => {
        if (inlineSegment.startsWith('`') && inlineSegment.endsWith('`')) {
          // This is an inline code snippet
          return (
            <code key={'inline-' + inlineIndex}>
              {inlineSegment.substring(1, inlineSegment.length - 1)}
            </code>
          );
        } else {
          // This is regular text, parse for bold text and links
          return inlineSegment.split(/(\*\*.*?\*\*)|(%%.*?%%)/g).map((part, partIndex) => {
            if (part && part.startsWith('**') && part.endsWith('**')) {
              // Bold text processing
              return <strong key={'bold-' + partIndex}>{part.slice(2, -2)}</strong>;
            } else if (part && part.startsWith('%%') && part.endsWith('%%')) {
              // Link processing
              const sourcePageRegex = /%%Source: (.*?) Page: (\d+)%%/;
              const match = sourcePageRegex.exec(part);
              if (match) {
                const [_, source, page] = match;
                const url = `/pdf/${source}`;
                const filename = url.split('/').pop();
                return (
                  <a key={'link-' + partIndex} href={url + `#page=${page}`} target="_blank" rel="noopener noreferrer"
                     style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 625 }}>
                    {filename}
                  </a>
                );
              }
            }
            return <span key={'text-' + partIndex}>{part}</span>;
          });
        }
      });
    }
  });
}





  

