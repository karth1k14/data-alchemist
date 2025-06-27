import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { data, headers, prompt } = await req.json();

  const csvText = [headers, ...data].map(row => row.join(',')).join('\n');

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You're a helpful assistant. Only output modified CSV. No extra text."
        },
        {
          role: "user",
          content: `Here is the CSV:\n${csvText}\n\nInstruction:\n${prompt}`
        }
      ],
      temperature: 0.2
    })
  });

  const result = await response.json();
  console.log("🧠 OpenAI Raw Response:", JSON.stringify(result, null, 2));

  const content = result.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return NextResponse.json({ success: false, error: "No response from AI" }, { status: 500 });
  }

  try {
    const lines = content.split('\n');
    const newHeaders = lines[0].split(',');
    const newData = lines.slice(1).map((line: string) => line.split(','));

    return NextResponse.json({ success: true, headers: newHeaders, updatedData: newData });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to parse AI response" }, { status: 500 });
  }
}
