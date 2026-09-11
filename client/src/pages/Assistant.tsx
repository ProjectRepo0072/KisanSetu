import { useState } from "react";
import { useLocale } from "../i18n/LocaleContext";
import { translateAssistantAnswer, translateAssistantNote } from "../i18n/serverTextTranslator";
import { api } from "../lib/api";
import { SectionHeading } from "../components/ui";
import { Send, MessageCircleQuestion } from "lucide-react";

export default function Assistant() {
  const { t } = useLocale();
  const SUGGESTED_KEYS = ["assistant.suggested1", "assistant.suggested2", "assistant.suggested3"];
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string; note?: string }[]>([
    { role: "assistant", text: t("assistant.greeting") },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(question: string) {
    if (!question.trim()) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/assistant/ask", { question });
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: translateAssistantAnswer(t, res.answer, res.source),
          note: translateAssistantNote(t, res.note, res.source),
        },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: t("assistant.unavailable") }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <SectionHeading title={t("assistant.title")} subtitle={t("assistant.subtitle")} />

      <div className="card p-4 mb-3 flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto space-y-3 mb-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${m.role === "user" ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-800"}`}>
                {m.role === "assistant" && <MessageCircleQuestion size={14} className="inline mr-1 -mt-0.5 text-brand-600" />}
                {m.text}
                {m.note && <div className="text-[10px] text-stone-400 mt-1">{m.note}</div>}
              </div>
            </div>
          ))}
          {loading && <div className="text-xs text-stone-400">{t("assistant.thinking")}</div>}
        </div>
        <div className="flex gap-2">
          <input className="input" placeholder={t("assistant.placeholder")} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)} />
          <button className="btn-primary" onClick={() => send(input)} disabled={loading}><Send size={16} /></button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_KEYS.map((k) => (
          <button key={k} className="btn-secondary text-xs" onClick={() => send(t(k))}>{t(k)}</button>
        ))}
      </div>
    </div>
  );
}
