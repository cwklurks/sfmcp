const SUPABASE_URL = "https://kyvjujelxbczhookrsla.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dmp1amVseGJjemhvb2tyc2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzMzNzYsImV4cCI6MjA4Njg0OTM3Nn0.wullGO2VAVhGFuKtoKaC8KwVDDrOuTRtAmnAxd__Iec";

interface Guide {
  readonly slug: string;
  readonly title: string;
  readonly subtitle: string;
  readonly content: string;
  readonly published: boolean;
}

async function fetchGuides(): Promise<Guide[]> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/guides?select=slug,title,subtitle,content,published&published=eq.true&order=display_order`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch guides: ${response.status}`);
  }

  return response.json() as Promise<Guide[]>;
}

export async function listGuides(): Promise<string> {
  const guides = await fetchGuides();

  const lines = guides.map(
    (g, i) => `${i + 1}. **${g.title}**\n   Slug: \`${g.slug}\`\n   ${g.subtitle}`
  );

  return `${guides.length} guides available:\n\n${lines.join("\n\n")}`;
}

export interface ReadGuideInput {
  readonly slug: string;
}

export async function readGuide(input: ReadGuideInput): Promise<string> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/guides?select=slug,title,subtitle,content,published&slug=eq.${encodeURIComponent(input.slug)}&published=eq.true&limit=1`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch guide: ${response.status}`);
  }

  const guides = (await response.json()) as Guide[];

  if (guides.length === 0) {
    const allGuides = await fetchGuides();
    const slugs = allGuides.map((g) => g.slug).join(", ");
    return `Guide "${input.slug}" not found. Available guides: ${slugs}`;
  }

  const guide = guides[0];
  return `# ${guide.title}\n\n*${guide.subtitle}*\n\n${guide.content}`;
}
