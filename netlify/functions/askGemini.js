import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(request) {
  try {
    // Only allow POST
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Read body
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    // Init Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    // Generate
    const result = await model.generateContent(prompt);

    const text = result.response.text();

    // Return success
    return new Response(
      JSON.stringify({ reply: text }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

  } catch (err) {
    console.error("Gemini Error:", err);

    return new Response(
      JSON.stringify({
        error: "Server error",
        details: err.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
