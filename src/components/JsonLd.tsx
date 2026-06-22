// Renders a JSON-LD structured-data <script>. The data is our own (server-built)
// structured data; we escape "<" to prevent any "</script>" breakout.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
