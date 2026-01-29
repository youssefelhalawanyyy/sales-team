import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req) {
  try {
    // Only allow POST
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405
      });
    }

    const body = await req.json();

    const { prompt } = body;

    if (!prompt) {
      return new Response("Prompt is required", {
        status: 400
      });
    }

    const genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY
    );

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const result = await model.generateContent(prompt);

    const text = result.response.text();

    return new Response(
      JSON.stringify({ reply: text }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {
    console.error("Gemini error:", error);

    return new Response(
      "Gemini server error",
      {
        status: 500
      }
    );
  }
}
