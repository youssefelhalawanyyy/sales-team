import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());


/* ===========================
   JONIX AI KNOWLEDGE
=========================== */

const JONIX_DATA = `
You are Jonix AI Sales Assistant.

Only answer about Jonix devices.

Language:
- Arabic if user writes Arabic
- English if user writes English

Products:

Cube Professional
Coverage: 85 m2
Price: 2000 EUR
For: Clinics, Offices, Beauty

Steel 4C
Coverage: 500 m3
Price: 6000 EUR
For: Cold rooms, Food

Duct 4F
Coverage: 2000 m3/h
Price: 4000 EUR
For: HVAC


Rules:
- Recommend best device
- Can suggest 2 units
- Convert EUR to EGP (1 EUR = 55 EGP)
- Short answers
- Sales tone
- No theory
`;


/* ===========================
   AI ROUTE
=========================== */

app.post("/api/ask", async (req, res) => {

  try {

    const { question } = req.body;

    if (!question) {
      return res.json({ answer: "Empty question" });
    }

    const prompt = `
${JONIX_DATA}

Customer:
${question}

Reply:
`;

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        contents: [
          { parts: [{ text: prompt }] }
        ]
      },
      {
        params: {
          key: process.env.GEMINI_KEY
        }
      }
    );

    const answer =
      response.data.candidates[0].content.parts[0].text;

    res.json({ answer });

  } catch (err) {

    console.error(err.response?.data || err.message);

    res.status(500).json({
      answer: "AI service error"
    });

  }

});


/* ===========================
   START SERVER
=========================== */

app.listen(5000, () => {
  console.log("🚀 Jonix AI Backend running on 5000");
});
