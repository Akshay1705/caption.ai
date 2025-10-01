import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; 
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function fileToGenerativePart(base64Data: string, mimeType: string) {
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userEmail = session.user.email;

    const body = await req.json();
    const { image, description, style, subject, occasion, mood } = body;

    // --- Add input validation ---
    if (!image) {
      return NextResponse.json(
        { error: "Please upload an image to generate content." },
        { status: 400 } // 400 means "Bad Request"
      );
    }
    // --- END of logic ---

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemInstruction = `You are an expert social media manager for platforms like Instagram and TikTok.
    Your task is to generate a caption, hashtags, and song suggestions for a social media post.

    User Preferences:
    - Style: ${style || 'Not specified'}
    - Subject: ${subject || 'Not specified'}
    - Occasion: ${occasion || 'Not-specified'}
    - Mood: ${mood || 'Not-specified'}
    - Additional Description: ${description || 'Not specified'}
    
    Instructions:
    1.  Analyze the image and preferences to write an engaging caption.
    2.  Provide 5-7 relevant hashtags. IMPORTANT: Do NOT include the '#' symbol.
    3.  Song Suggestion (Crucial): First, deeply analyze the visual elements, mood, and subject of the photo to determine its specific "vibe" or "aesthetic" (e.g., "upbeat summer vacation," "cozy rainy day," "dramatic fashion look," "energetic workout"). Then, suggest 2-3 songs that are a perfect match for that specific vibe. The songs should be popular and fitting for Instagram Reels or TikTok.
    4.  You MUST respond with only a valid, minified JSON object and nothing else.
    
    The JSON structure MUST be:
    {
      "caption": "Your generated caption here.",
      "hashtags": ["hashtagone", "hashtagtow", "hashtagthree"],
      "songs": ["Song Name 1 - Artist", "Song Name 2 - Artist"]
    }`;

    const promptParts: Part[] = [{ text: systemInstruction }];
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
        promptParts.push(fileToGenerativePart(match[2], match[1]));
    } else {
        // Handle cases where the image format is invalid, just in case
        return NextResponse.json({ error: "Invalid image format." }, { status: 400 });
    }
    
    const result = await model.generateContent({ contents: [{ role: "user", parts: promptParts }]});
    const response = result.response;
    let content = response.text();

    if (!content) {
      throw new Error("AI failed to generate content.");
    }
    
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      content = content.substring(firstBrace, lastBrace + 1);
    }

    const parsedContent = JSON.parse(content);
    const { caption, hashtags, songs } = parsedContent;
    
    const postToInsert = {
      user_email: userEmail,
      image: image,
      caption: caption,
      hashtags: hashtags,
      songs: songs,
    };

    const { data: newPost, error: insertError } = await supabase
      .from("posts")
      .insert(postToInsert)
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      throw new Error(insertError.message);
    }
    
    // History Trimming Logic
    const HISTORY_LIMIT = 5;
    const { data: userPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: true });

    if (userPosts && userPosts.length > HISTORY_LIMIT) {
        const idsToDelete = userPosts
            .slice(0, userPosts.length - HISTORY_LIMIT)
            .map(p => p.id);
        await supabase.from('posts').delete().in('id', idsToDelete);
    }

    return NextResponse.json({ post: newPost });

  } catch (error) {
    console.error("Generate API error:", error);
    // This catch block handles the "server error" case
    const message = error instanceof Error ? error.message : "Internal Server Error. Please try again later.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}