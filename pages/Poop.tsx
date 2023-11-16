const hasUserMessages = messages.some(message => message.type === 'userMessage');

function renderHeader() {
  if (!hasUserMessages) {
    // If no user messages, return the centered title
    return (
      <div className="centeredTitle">
        <h1>CornellGPT: {courseTitle}</h1>
      </div>
    );
  } else {
    // If there are user messages, return the header section
    return (
      <div className="headerSection" style={{ marginLeft: '130px', marginTop: '10px' }}>
        <h1 className="text-4xl font-bold leading-[1.1] tracking-tighter text-center">
          CornellGPT: <span className={styles.selectedClassName}>{courseTitle}</span>
        </h1>
      </div>
    );
  }
}
return (
  <div className="appWrapper">
    {hasUserMessages && (
      <aside> 
        {courseTitle ? 
          <Sidebar className={courseTitle} onSessionChange={handleSessionChange} onNewChat={handleSessionChange} /> 
          : null}
      </aside>
    )}
    <div className={`mainContent ${!hasUserMessages ? "centeredContent" : ""}`} key={refreshKey}>
      {renderHeader()}
      {hasUserMessages && (
        <main className={styles.main}>
          <div className={styles.cloud}>
            <div ref={messageListRef} className={styles.messagelist}>

              {messages.map((message, index) => {
  // Your message type handling logic 
  let icon;
  let className;
  let content;

  // const uniqueSources = getUniqueSources(message.sourceDocs).slice(0, 5);

  if (message.type === 'apiMessage') {
      icon = (
          <Image
              key={index}
              src="/bigblackbear.png"
              alt="AI"
              width="50"
              height="90"
              className={styles.boticon}
              priority
          />
      );
      className = styles.apimessage;
  } else {
      icon = (
          <Image
              key={index}
              src="/usericon.png"
              alt="Me"
              width="45"
              height="35"
              className={styles.usericon}
              priority
          />
      );
      className = loading && index === messages.length - 1
          ? styles.usermessagewaiting
          : styles.usermessage;
  }


// if (messageContainsMath(message.message)) {
//     content = <MessageRenderer key={index} message={message.message} />;
// } else if (isCodeMessage) {
//     content = <CodeBlock key={index} code={transformMessageWithCode(message.message)} />;
// } else {
//     if (message.type === 'apiMessage' && !isCodeMessage && !messageContainsMath) {  
//         content = <Typewriter message={message.message} />; } 
//     else {
//         content = <span>{message.message}</span>;
//     }
// }



const isCodeMessage = index > 0 && message.type === 'apiMessage' && messageContainsCode(messages[index - 1].message, message.message);
const isLatestApiMessage = index === messages.length - 1 && message.type === 'apiMessage';


//&& !isCodeMessage && !messageContainsMath
if (messageContainsMath(message.message)) {
  content = <MessageRenderer key={index} message={message.message} />;
} else if (isCodeMessage) {
  content = <CodeBlock key={index} code={transformMessageWithCode(message.message)} />;
} else if (message.type === 'apiMessage' ) {                        
  content = <Typewriter key={index} message={parseBoldText(message.message)} animate={isLatestApiMessage} />;
} else {
  content = <span>{parseBoldText(message.message)}</span>;
}






// if (message.type === 'apiMessage' && !isCodeMessage) {
//   const formattedMessage = message.message.replace(/\n/g, '<br/>');
//   content = <div dangerouslySetInnerHTML={{ __html: formattedMessage }} />;}
//   } else {
//     content = <Typewriter message={message.message} />;
//   }
// } else if (isCodeMessage) {
//   content = <CodeBlock key={index} code={transformMessageWithCode(message.message)} />;
// } else {
//   content = <span>{message.message}</span>;
// }


// if (messageContainsMath(message.message)) {
// content = <MessageRenderer key={index} message={message.message} />;
//  }
//  else if (message.type === 'apiMessage' && !isCodeMessage) {
//   const normalizedMessage = message.message.replace(/\r\n/g, '\n');
//   const lines = normalizedMessage.split('\n');
//   content = lines.map((line, idx) => (
//     <div key={idx} className="line">
//       <Typewriter message={line} />
//       {idx < lines.length - 1 && <br />}
//     </div>
//   ));
// } else if (isCodeMessage) {
//   content = <CodeBlock key={index} code={transformMessageWithCode(message.message)} />;
// } else {
//   content = <span>{message.message}</span>;
// }

  if (isLoading) {
    return <>Loading...</>;
  }   
  return (
      <>
          <div key={`chatMessage-${index}`} className={className}>
              {icon}
              <div className={styles.markdownanswer}
                  style={
                      isCodeMessage ? {
                          backgroundColor: "#f5f5f5",
                          padding: "10px",
                          borderRadius: "5px",
                          display: "block",
                          margin: "1em 0",
                          border: "1px solid #ddd",
                          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                          fontFamily: "'Courier New', monospace",
                          fontSize: "14px",
                          color: "black",
                          lineHeight: "1.4",
                      } : {}
                  }>
                  {content}
              </div>
          </div>
                    {message.sourceDocs && (
                      <div
                        className="p-5"
                        key={`sourceDocsAccordion-${index}`}
                      >
                        <Accordion
                          type="single"
                          collapsible
                          className="flex-col"
                        >
                          {message.sourceDocs.slice(0, showMoreSources ? message.sourceDocs.length : 5).map((doc: any, index) => (
                            <div key={`messageSourceDocs-${index}`}> 
                            {/* //look at this section */}
                              <AccordionItem value={`item-${index}`}>
                                <AccordionTrigger>
                                  <h3>Source {index + 1}</h3>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <ReactMarkdown linkTarget="_blank">
                                    {doc.text}
                                  </ReactMarkdown>
                                  <p className="mt-2">
                                  <b>Source: </b> 
                                  <a href={`/pdfs/${doc.Source.split('/').pop()}#page=${doc.Page_Number}`} target="_blank" rel="noopener noreferrer" 
                                  style={{
                                    color: 'red',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    fontWeight: 625
                                }}>
                                  {doc.Source.split('/').pop()}
                                  </a>

                                  </p>
                                  <p>
                                    <b> Page number: </b> {doc.Page_Number}
                                  </p>
                                  <p>
                                    <b> Total Pages: </b> {doc.Total_Pages}
                                  </p>
                                </AccordionContent>
                              </AccordionItem>
                            </div>
                          ))}



{message.sourceDocs.length > 5 && !showMoreSources && (
<button className="p-2 text-sm text-red-500" onClick={() => setShowMoreSources(true)}>
  Show More
</button>
)}
{showMoreSources && (
<button className="p-2 text-sm text-red-500" onClick={() => setShowMoreSources(false)}>
  Show Less
</button>
)}   
                        </Accordion>
                      </div>
                    )}
                  </>
                );
              })}
            </div>
          </div>
          <div className={styles.center}>
            <div className={styles.cloudform}>
              <form onSubmit={handleSubmit}>
                <textarea
                  disabled={loading}
                  onKeyDown={handleEnter}
                  ref={textAreaRef}
                  autoFocus={false}
                  rows={1}
                  maxLength={100000} // input size adjustment***
                  id="userInput"
                  name="userInput"
                  placeholder={
                    loading
                      ? 'Retrieving...'
                      : 'Message CornellGPT...'
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={styles.textarea}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.generatebutton}
                >
                  {loading ? (
                    <div className={styles.loadingwheel}>
                      <LoadingDots color="rgb(146, 40, 40)" />
                    </div>
                  ) : (
                    // Send icon SVG in input field
                    <svg
                      viewBox="0 0 20 20"
                      className={styles.svgicon}
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </div>
          {error && (
            <div className="border border-red-400 rounded-md p-4">
              <p className="text-red-500">{error}</p>
            </div>
          )}
        </main>
      )}
      </div>
      <footer className="m-auto p-4">
        {/* Footer content */}
      </footer>
    </div>
  );
}