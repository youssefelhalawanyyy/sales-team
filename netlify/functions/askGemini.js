import { GoogleGenerativeAI } from "@google/generative-ai";

export default async (req, context) => {
  try {
    // Allow only POST
    if (req.method !== "POST") {
      return {
        statusCode: 405,
        body: "Method Not Allowed",
      };
    }

    const { prompt } = JSON.parse(req.body || "{}");

    if (!prompt) {
      return {
        statusCode: 400,
        body: "Prompt required",
      };
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent(prompt);

    const text = result.response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: text }),
    };
  } catch (err) {
    console.error("Gemini error:", err);

    return {
      statusCode: 500,
      body: "Gemini server error",
    };
  }
};
