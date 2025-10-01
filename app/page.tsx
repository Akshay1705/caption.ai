"use client";

import { useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Post } from "@/types";

import Navbar from "@/components/Navbar";
import InputArea from "@/components/InputArea";
import OutputArea from "@/components/OutputArea";
import HistoryArea from "@/components/HistoryArea";

export default function Home() {
  const { data: session, status } = useSession();

  // Form state
  const [image, setImage] = useState<string | null>(null);
  const [style, setStyle] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [occasion, setOccasion] = useState<string>("");
  const [mood, setMood] = useState<string>("");
  const [desc, setDesc] = useState<string>("");

  // Output state
  const [caption, setCaption] = useState<string>("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [songs, setSongs] = useState<string[]>([]);

  // History state
  const [history, setHistory] = useState<Post[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  const resultRef = useRef<HTMLDivElement | null>(null);

  // Fetch history from the database when the user session is available
  useEffect(() => {
    const fetchHistory = async () => {
      if (session) {
        setLoading(true);
        try {
          const res = await fetch("/api/history");
          if (res.ok) {
            const data = await res.json();
            setHistory(data);
          } else {
            console.error("Failed to fetch history");
          }
        } catch (err) {
          console.error("Error fetching history:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchHistory();
  }, [session]);

  const handleGenerate = async () => {
    if (!session) {
      signIn("google");
      return;
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

      // Set output states from the new post returned by the API
      setCaption(data.post.caption || "");
      setHashtags(data.post.hashtags || []);
      setSongs(data.post.songs || []);

      // Add the new post to the history for immediate UI feedback
      setHistory((prev) => [data.post, ...prev]);

      // Scroll to results
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
    } catch (err: unknown) {
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
      // Ignore copy errors
    }
  };

  const handleDeleteHistory = async (id: number) => {
    const originalHistory = history;
    // Optimistically remove from the UI for a snappy user experience
    setHistory((currentHistory) => currentHistory.filter((p) => p.id !== id));

    try {
      const res = await fetch("/api/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        // If the delete fails on the server, revert the UI change
        setHistory(originalHistory);
        console.error("Failed to delete post from server.");
      }
    } catch (err) {
      // If there's a network error, also revert the UI change
      setHistory(originalHistory);
      console.error("Error deleting post:", err);
    }
  };

  if (status === "loading") {
    return <div className="p-8 text-center">Loading…</div>;
  }

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