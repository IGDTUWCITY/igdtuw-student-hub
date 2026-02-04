import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, X, Loader2, User, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { processUserQuery } from "@/lib/ai/agent";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your IGDTUW AI Assistant. Select an option below to get started!",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change or chat opens
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async (messageText: string) => {
    setIsSuggestionsOpen(false);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await processUserQuery(userMessage.content);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting to the Student Hub right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "What societies can I join?",
    "Are there any upcoming hackathons?",
    "Show me internship opportunities",
    "Latest university announcements"
  ];

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Handle bold text **text** and links [text](url)
      const parts = line.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
      return (
        <div key={i} className={`min-h-[1.5em] ${line.startsWith('- ') ? 'pl-4' : ''}`}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            } else if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
              const text = part.substring(1, part.indexOf(']'));
              const url = part.substring(part.indexOf('](') + 2, part.length - 1);
              return (
                <a 
                  key={j} 
                  href={url} 
                  className="text-primary underline hover:text-primary/80"
                  target={url.startsWith('http') ? "_blank" : "_self"}
                  rel={url.startsWith('http') ? "noopener noreferrer" : undefined}
                >
                  {text}
                </a>
              );
            }
            return part;
          })}
        </div>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 pointer-events-auto"
          >
            <Card className="w-[350px] md:w-[400px] h-[500px] shadow-2xl border-primary/20 flex flex-col overflow-hidden bg-background/95 backdrop-blur-sm">
              <CardHeader className="bg-primary/5 p-4 border-b flex flex-row items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">IGDTUW Assistant</CardTitle>
                    <p className="text-xs text-muted-foreground">Select an option to start</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              
              <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4 pb-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-3 max-w-[85%]",
                          msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                          msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2 text-sm shadow-sm",
                            msg.role === "user" 
                              ? "bg-primary text-primary-foreground rounded-tr-none" 
                              : "bg-muted text-foreground rounded-tl-none"
                          )}
                        >
                          <div className="whitespace-pre-wrap">{formatMessage(msg.content)}</div>
                          <div className="text-[10px] opacity-50 mt-1">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-2 flex items-center">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
                
                <div className="bg-muted/20 border-t">
                  <button 
                    onClick={() => setIsSuggestionsOpen(!isSuggestionsOpen)}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                  >
                    <p className="text-xs text-muted-foreground font-medium px-1">Suggested Options</p>
                    {isSuggestionsOpen ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <AnimatePresence initial={false}>
                    {isSuggestionsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-0 grid grid-cols-1 gap-2">
                          {suggestions.map((question, index) => (
                            <button
                              key={index}
                              onClick={() => !isLoading && handleSend(question)}
                              disabled={isLoading}
                              className="text-left text-sm bg-background hover:bg-accent hover:text-accent-foreground p-2.5 rounded-lg transition-colors border shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>


      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center transition-all hover:bg-primary/90"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Sparkles className="w-6 h-6" />
        )}
      </motion.button>
    </div>
  );
}
