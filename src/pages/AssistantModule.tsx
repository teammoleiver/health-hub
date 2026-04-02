import { useState } from "react";
import { Send, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME = `Hi Saleh! 👋 I'm your Health Track AI assistant. I have access to all your health data including:

• Both blood tests (Feb 4 & Mar 27, 2026)
• EGYM fitness data (BioAge: 48)
• Your nutrition plan from Nutreya
• Fasting protocols (16:8 active)
• Body composition & goals

Ask me anything about your health — for example:
- "Can I eat a croissant today?"
- "How is my liver doing?"
- "What exercise should I focus on?"

⚠️ *Note: AI features require connecting your OpenAI API key in Settings.*`;

export default function AssistantModule() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages([...messages, userMsg, {
      role: "assistant",
      content: "⚠️ AI assistant requires connecting your OpenAI API key in Settings. Once connected, I'll be able to analyze your health data and provide personalized advice.\n\nIn the meantime, here's a general tip: Stay consistent with your IF 16:8 window and prioritize liver-friendly foods (leafy greens, lean protein, no fried foods).",
    }]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen max-w-3xl mx-auto">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-display font-bold text-foreground">AI Health Assistant</h1>
        <p className="text-xs text-muted-foreground">Powered by OpenAI — knows your complete health profile</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-xl p-3 text-sm ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "glass-card text-foreground"
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about your health..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={send}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-dark transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
