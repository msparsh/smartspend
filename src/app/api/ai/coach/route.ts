import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { query, transactions, budgets } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is not configured on the server. Falling back to local offline coach.",
          isOfflineFallback: true
        },
        { status: 501 } // 501 Not Implemented / Not Configured
      );
    }

    // Prepare system instructions and contextual data
    const contextPrompt = `
You are the SmartSpend AI Coach, a friendly, student-focused financial co-pilot. You help college students manage their money, stipends, allowance, canteen food, hostel bills, travel, and entertainment.
Your tone is encouraging, savvy, slightly casual, and direct. Use bullet points, emojis, bold text, and brief paragraph structures to make your answers easy to read on a mobile screen.

Here is the student's current financial data:
---
BUDGETS:
${JSON.stringify(budgets, null, 2)}

TRANSACTIONS (Income and Expenses):
${JSON.stringify(transactions, null, 2)}
---

STUDENT'S QUERY:
"${query}"

Instructions:
1. Provide a concise, action-oriented response tailored to this query.
2. Rely on the provided financial data to do quick calculations if needed (e.g. sum spending for a category).
3. Suggest 1 or 2 specific student-friendly tips (e.g. buying second-hand textbooks, splitting subscriptions, cutting back on food delivery apps, sharing rides, student discounts).
4. Limit your response to 150-250 words so it fits beautifully in a chat bubble on a mobile screen.
5. Do not use generic advice unless it directly relates to their question. If they ask about overspending, name the category they are overspending on.
    `;

    // Make direct API call to Gemini API (gemini-1.5-flash)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: contextPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error Response:", errText);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const resData = await response.json();
    const replyText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      throw new Error("Invalid response structure from Gemini API");
    }

    return NextResponse.json({ reply: replyText });
  } catch (error: any) {
    console.error("AI Coach API error:", error);
    return NextResponse.json(
      { error: "Failed to query AI Coach API: " + error.message, isOfflineFallback: true },
      { status: 500 }
    );
  }
}
