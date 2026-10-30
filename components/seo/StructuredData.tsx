/**
 * Renders JSON-LD. Server Component by default so the markup is in the initial HTML.
 */
export function StructuredData({
  data,
  id,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
  id?: string;
}) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" id={id} dangerouslySetInnerHTML={{ __html: json }} />;
}
