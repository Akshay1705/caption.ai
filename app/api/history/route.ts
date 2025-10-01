import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; 
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin"; // Use admin client for consistency

// --- GET Request: Fetches all posts for the logged-in user ---
export async function GET() { 
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userEmail = session.user.email;

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false }); 

    if (error) {
      throw new Error(error.message);
    }
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// --- DELETE Request: Deletes a single post by its ID ---
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userEmail = session.user.email;

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("posts")
      .delete()
      .match({ id: id, user_email: userEmail });

    if (error) {
      throw new Error(error.message);
    }
    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}