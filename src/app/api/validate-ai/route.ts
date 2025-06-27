import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { headers, data } = await req.json();

  const table = [headers, ...data];
  const csvText = table.map(row => row.join(',')).join('\n');

  const prompt = `
Analyze the following CSV data and return any data quality or logical issues.
Examples:
- Missing values in important columns
- Invalid PriorityLevel
- Conflicting Task-Group associations
- Odd patterns or anomalies

Respond with a plain list of issues.

CSV:
${csvText}
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a senior data QA assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3
    })
  });

  const result = await response.json();
  const text = result.choices?.[0]?.message?.content?.trim();

  return NextResponse.json({ success: true, findings: text });
}
