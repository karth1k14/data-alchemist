import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const userPrompt = body.prompt;

  const prompt = `
Convert the following natural language rule to a JSON object with keys like "type", "target1", "target2", "value" if applicable.

Example:
Input: Co-run T1 and T2
Output: { "type": "co-run", "target1": "T1", "target2": "T2" }

Now convert:
"${userPrompt}"
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a JSON rule generator." },
        { role: "user", content: prompt }
      ],
      temperature: 0,
    }),
  });

  const data = await response.json();
  const raw = data.choices[0].message.content.trim();

  try {
    const rule = JSON.parse(raw);
    return NextResponse.json({ success: true, rule });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to parse AI response." }, { status: 400 });
  }
}
