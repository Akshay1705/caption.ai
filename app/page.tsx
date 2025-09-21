// app/page.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Post } from "@/types"; // Import the shared type

// Import the new components
import Navbar from "@/components/Navbar";
import InputArea from "@/components/InputArea";
import OutputArea from "@/components/OutputArea";
import HistoryArea from "@/components/HistoryArea";

export default function Home() {
  const { data: session, status } = useSession();

  // form state
  const [image, setImage] = useState<string | null>(null);
  const [style, setStyle] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [occasion, setOccasion] = useState<string>("");
  const [mood, setMood] = useState<string>("");
  const [desc, setDesc] = useState<string>("");

  // outputs
  const [caption, setCaption] = useState<string>("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [songs, setSongs] = useState<string[]>([]);

  // history (persisted)
  const [history, setHistory] = useState<Post[]>(() => {
    try {
      const raw = typeof window !== "undefined" && localStorage.getItem("ai_history");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // UI / copy state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  const resultRef = useRef<HTMLDivElement | null>(null);

  // keep history persisted
  useEffect(() => {
    try {
      localStorage.setItem("ai_history", JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  // generate (calls your backend /api/generate)
  const handleGenerate = async () => {
    if (!session) {
      return signIn("google");
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, style, subject, occasion, mood, image }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate content");
      }

      setCaption(data.caption || "");
      setHashtags(Array.isArray(data.hashtags) ? data.hashtags : []);
      setSongs(Array.isArray(data.songs) ? data.songs : (data.songs ? [data.songs] : []));

      const post: Post = {
        id: Date.now(),
        image,
        caption: data.caption || "",
        hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
        songs: Array.isArray(data.songs) ? data.songs : (data.songs ? [data.songs] : []),
        createdAt: new Date().toISOString(),
      };
      setHistory((prev) => [post, ...prev]);

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
    } catch (err: unknown) {
      console.error("generate error", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(`${caption}\n\n${hashtags.join(" ")}`);
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  
  const handleDeleteHistory = (id: number) => {
    setHistory((currentHistory) => currentHistory.filter((p) => p.id !== id));
  };

  if (status === "loading") return <div className="p-8 text-center">Loading…</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar session={session} />

      <main className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <InputArea
            image={image} setImage={setImage}
            style={style} setStyle={setStyle}
            subject={subject} setSubject={setSubject}
            occasion={occasion} setOccasion={setOccasion}
            mood={mood} setMood={setMood}
            desc={desc} setDesc={setDesc}
            loading={loading} error={error}
            handleGenerate={handleGenerate}
          />

          <OutputArea
            caption={caption}
            hashtags={hashtags}
            songs={songs}
            allCopied={allCopied}
            resultRef={resultRef}
            copyAll={copyAll}
          />
        </div>

        <HistoryArea history={history} handleDelete={handleDeleteHistory} />
      </main>
    </div>
  );
}