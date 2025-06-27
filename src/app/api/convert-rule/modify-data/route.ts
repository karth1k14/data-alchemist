import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { data, headers, prompt } = await req.json();

  const table = [headers, ...data];
  const tableText = table.map(row => row.join(',')).join('\n');

  const fullPrompt = `
You are a smart data modifier. Here's a table (CSV format):

${tableText}

Instruction: ${prompt}

Respond ONLY with the modified table as CSV. No explanation or commentary.
`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You modify data tables." },
        { role: "user", content: fullPrompt },
      ],
      temperature: 0.3,
    }),
  });

  const result = await openaiRes.json();
  const csv = result.choices[0].message.content.trim();
  const lines = csv.split('\n').slice(1);
  const updatedData = lines.map((line: string) => line.split(','));


  return NextResponse.json({ success: true, updatedData });
}
