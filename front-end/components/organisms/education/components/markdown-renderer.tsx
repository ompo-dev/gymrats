import React from "react";

export function MarkdownRenderer({ content }: { content: string }) {
  const renderMarkdown = (content: string) => {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let currentParagraph: string[] = [];
    let inList = false;
    let listItems: string[] = [];
    let listOrdered = false;

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(" ");
        elements.push(
          <p
            key={elements.length}
            className="mb-4 leading-relaxed text-duo-text"
          >
            {renderInlineMarkdown(text)}
          </p>
        );
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (listItems.length > 0) {
        const ListTag = listOrdered ? "ol" : "ul";
        elements.push(
          <ListTag
            key={elements.length}
            className={`mb-4 ml-6 space-y-2 ${
              listOrdered ? "list-decimal" : "list-disc"
            }`}
          >
            {listItems.map((item, i) => (
              <li key={i} className="leading-relaxed text-duo-text">
                {renderInlineMarkdown(
                  item.trim().replace(/^[-*]\s+|^\d+\.\s+/, "")
                )}
              </li>
            ))}
          </ListTag>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        flushList();
        return;
      }

      if (trimmed.startsWith("##")) {
        flushParagraph();
        flushList();
        const headingText = trimmed.replace(/^#+\s+/, "").trim();
        const level = trimmed.match(/^#+/)?.[0].length || 2;

        if (level === 1) {
          elements.push(
            <h1
              key={elements.length}
              className="mb-4 mt-6 text-2xl font-bold text-duo-text"
            >
              {renderInlineMarkdown(headingText)}
            </h1>
          );
        } else if (level === 2) {
          elements.push(
            <h2
              key={elements.length}
              className="mb-3 mt-5 text-xl font-bold text-duo-text"
            >
              {renderInlineMarkdown(headingText)}
            </h2>
          );
        } else {
          elements.push(
            <h3
              key={elements.length}
              className="mb-2 mt-4 text-lg font-bold text-duo-text"
            >
              {renderInlineMarkdown(headingText)}
            </h3>
          );
        }
        return;
      }

      if (
        trimmed.startsWith("**") &&
        trimmed.endsWith("**") &&
        trimmed.split("**").length === 3
      ) {
        const headingText = trimmed.replace(/\*\*/g, "").trim();
        flushParagraph();
        flushList();
        elements.push(
          <h2
            key={elements.length}
            className="mb-3 mt-5 text-xl font-bold text-duo-text"
          >
            {headingText}
          </h2>
        );
        return;
      }

      if (/^[-*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
        flushParagraph();
        const isOrdered = /^\d+\.\s/.test(trimmed);
        if (!inList || listOrdered !== isOrdered) {
          flushList();
          listOrdered = isOrdered;
          inList = true;
        }
        listItems.push(trimmed);
        return;
      }

      flushList();
      currentParagraph.push(trimmed);
    });

    flushParagraph();
    flushList();

    return elements;
  };

  const renderInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={match.index} className="font-bold text-duo-text">
          {match[1]}
        </strong>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="prose max-w-none text-duo-text">
      {renderMarkdown(content)}
    </div>
  );
}
