import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { headers, data } = await req.json();
  const csv = [headers, ...data].map(row => row.join(',')).join('\n');

  const messages = [
    {
      role: "system",
      content: "You are a smart AI that analyzes CSV data and suggests useful task allocation rules. Return 3–5 clear rule suggestions. Do NOT explain."
    },
    {
      role: "user",
      content: `Analyze the following CSV data and suggest rules:\n\n${csv}`
    }
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.4
      })
    });

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json({ success: false, error: "No rules returned by AI" }, { status: 500 });
    }

    return NextResponse.json({ success: true, suggestions: content });
  } catch (error) {
    console.error("💥 Rule Suggestion Error:", error);
    return NextResponse.json({ success: false, error: "Failed to contact OpenAI" }, { status: 500 });
  }
}
