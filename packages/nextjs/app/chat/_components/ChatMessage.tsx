"use client";

interface ChatMessageProps {
  message: {
    role: "user" | "assistant";
    content: string;
  };
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div className={`chat ${isUser ? "chat-end" : "chat-start"}`}>
      <div className="chat-header opacity-70 text-xs">
        {isUser ? "You" : "AI"}
      </div>
      <div
        className={`chat-bubble ${
          isUser ? "chat-bubble-primary" : "chat-bubble-secondary"
        } whitespace-pre-wrap`}
      >
        {message.content}
      </div>
    </div>
  );
};
