export function messageContainsCode(message) {
  // Check if the message contains triple backticks
  return message.includes('```');
}



export function transformMessageWithCode(message) {
  const tripleBacktickSegments = message.split('```');

  return tripleBacktickSegments.map((segment, index) => {
    if (index % 2 === 1) {
      // This is a code block segment
      return (
        <div key={index} className="codeSegmentContainer">
          <pre><code>{segment}</code></pre>
        </div>
      );
    } else {
      // This is a non-code block segment, handle inline code snippets
      const inlineCodeSegments = segment.split(/(`.*?`)/);
      return inlineCodeSegments.map((inlineSegment, inlineIndex) => {
        if (inlineSegment.startsWith('`') && inlineSegment.endsWith('`')) {
          // This is an inline code snippet
          return (
            <code key={'inline' + inlineIndex}>
              {inlineSegment.substring(1, inlineSegment.length - 1)}
            </code>
          );
        } else {
          // This is regular text
          return <span key={'text' + inlineIndex}>{inlineSegment}</span>;
        }
      });
    }
  });
}






  

