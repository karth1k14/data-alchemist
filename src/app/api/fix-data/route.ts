import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { headers, data } = await req.json();

  const table = [headers, ...data];
  const csvText = table.map((row) => row.join(',')).join('\n');

  const prompt = `
You are a senior data repair AI.

Below is a CSV table. Fix any data issues such as:
- Broken or missing JSON in AttributesJSON
- Invalid PriorityLevel (should be 1–5)
- Missing required fields (fill with defaults)

Return the entire corrected table in CSV format, same structure.
NO explanation — only the corrected CSV.

CSV:
${csvText}
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You fix and return clean data tables." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    }),
  });

  const result = await response.json();
  const output = result.choices[0].message.content.trim();

  try {
    const lines = output.split('\n');
    const fixedHeaders = lines[0].split(',');
    const fixedData = lines.slice(1).map((line: string) => line.split(','));

    return NextResponse.json({ success: true, headers: fixedHeaders, data: fixedData });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to parse AI output' }, { status: 400 });
  }
}
