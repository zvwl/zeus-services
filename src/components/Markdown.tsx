import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-dark">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: (props) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-edge">
              <table className="w-full text-sm" {...props} />
            </div>
          ),
          th: (props) => (
            <th
              className="border-b border-edge bg-raised px-4 py-2.5 text-left font-semibold text-white"
              {...props}
            />
          ),
          td: (props) => (
            <td className="border-b border-edge/50 px-4 py-2.5 text-zinc-400" {...props} />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
