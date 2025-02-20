import React, { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism';


const TypewriterMessage = ({ content, speed = 2 }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + content.charAt(index));
      index++;
      if (index === content.length) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [content, speed]);

  const renderContent = (text) => {
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = text.split(codeBlockRegex);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <SyntaxHighlighter key={index} language="javascript" style={coy}>
            {part}
          </SyntaxHighlighter>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return <div>{displayedText}</div>;
};

export default TypewriterMessage;