import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { description, style, subject, mood, occasion, image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // Instruction prompt
    const prompt = `
      You are a creative Instagram caption generator.  

      Step 1: Analyze the uploaded image (scenery, objects, colors, vibe, emotions).  
      Step 2: Blend that analysis with the user’s preferences below:  
      - Style: ${style || "None"}  
      - Subject: ${subject || "None"}  
      - Mood: ${mood || "None"}  
      - Occasion: ${occasion || "None"}  
      - Extra notes: ${description || "None"}  

      Your Task:  
      1. Generate a short, natural Instagram caption (max 3 sentences). Use emojis only if they fit.  
      2. Suggest 8–10 hashtags (half image-specific, half vibe/occasion specific).  
      3. Suggest 2–3 trending/popular songs that match the photo vibe + user mood.  

      ⚠️ Rules:  
      - Do not output explanations or markdown.  
      - Return only valid JSON in this shape:  

      {
        "caption": "your caption here",
        "hashtags": ["#tag1", "#tag2"],
        "songs": ["Song 1", "Song 2"]
      }
    `;

    // Pass text + image as multimodal input
    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: "image/png", // or "image/jpeg" depending on upload
          data: image.replace(/^data:image\/\w+;base64,/, ""), // remove prefix if needed
        },
      },
    ]);

    let text = result.response.text().trim();
    text = text.replace(/```json|```/g, "").trim(); // clean if Gemini wraps in code fences

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Parse error, raw text:", text);
      data = { caption: text, hashtags: [], songs: [] };
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    let errorMessage = "Something went wrong. Please try again later.";

    if (err instanceof Error) {
      if (err.message.includes("503")) {
        errorMessage = "The AI service is currently overloaded. Please try again in a few moments.";
      } else if (err.message.includes("401")) {
        errorMessage = "Authentication failed. Please check your API key.";
      } else if (err.message.includes("429")) {
        errorMessage = "Too many requests. Please wait a bit before trying again.";
      } else {
        errorMessage = err.message; // fallback to actual error if not matched
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
