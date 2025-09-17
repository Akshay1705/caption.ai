"use client";

import { useEffect, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import {
  X,
  Upload,
  Copy,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModeToggle } from "@/components/ui/mode-toggle";

type Post = {
  id: number;
  image: string | null;
  caption: string;
  hashtags: string[];
  songs: string[];
  createdAt: string;
};

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
  
  // helper: detect data URL
  const isDataUrl = (s?: string | null) => !!s && s.startsWith("data:");

  // image handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  // generate (calls your backend /api/generate)
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: desc,
          style,
          subject,
          occasion,
          mood,
          image,
        }),
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

  // copy helpers with feedback
  const copy = async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 1500);
    } catch {
      // ignore
    }
  };

  const copyAll = () => copy(`${caption}\n\n${hashtags.join(" ")}`, setAllCopied);

  const copyHistory = (post: Post) =>
    copy(`${post.caption}\n\n${post.hashtags.join(" ")}\n\nSongs: ${post.songs.join(", ")}`, () => {});

  if (status === "loading") return <div className="p-8 text-center">Loading…</div>;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">caption.ai</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Sign in with Google to generate captions, hashtags, and song picks.
            </p>
            <Button onClick={() => signIn("google")}>Sign in with Google</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="w-full border-b bg-muted/50 dark:bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="font-semibold text-lg">caption.ai</div>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm font-medium">{session.user?.name}</span>
              {session.user?.image ? (
                <Image src={session.user.image} alt="avatar" width={36} height={36} className="rounded-full" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-300 dark:bg-gray-700" />
              )}
              <Button variant="outline" onClick={() => signOut()}
                className="dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Inputs + Outputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload & Options */}
          <Card className="shadow">
            <CardHeader>
              <CardTitle>Upload & Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload box */}
              <div>
                <label className="text-sm font-medium block mb-2">Photo</label>
                <label
                  htmlFor="image"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="flex flex-col items-center justify-center w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-primary hover:bg-muted/5 transition p-4 overflow-hidden"
                >
                  {image ? (
                    <Image
                      src={image}
                      alt="preview"
                      width={700}
                      height={350}
                      className="object-cover w-full h-full rounded"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="w-6 h-6" />
                      <p className="text-sm">Click or drag & drop to upload</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </label>
                <input id="image" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>

              {/* Selects grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Style */}
                <div>
                  <label className="text-sm font-medium block mb-1">Style</label>
                  <div className="flex flex-wrap gap-2">
                    {["Poetic", "Funny", "Inspiring"].map((opt) => (
                      <Button
                        key={opt}
                        variant={style === opt ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStyle(opt)}
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>
                {/* Subject */}
                <div>
                  <label className="text-sm font-medium block mb-1">Subject</label>
                  <div className="flex flex-wrap gap-2">
                    {["Selfie", "Food", "Travel", "Fashion"].map((opt) => (
                      <Button
                        key={opt}
                        variant={subject === opt ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSubject(opt)}
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>
                {/* Occasion */}
                <div>
                  <label className="text-sm font-medium block mb-1">Occasion</label>
                  <div className="flex flex-wrap gap-2">
                    {["Birthday", "Party", "Wedding", "Vacation"].map((opt) => (
                      <Button
                        key={opt}
                        variant={occasion === opt ? "default" : "outline"}
                        size="sm"
                        onClick={() => setOccasion(opt)}
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>
                {/* Mood */}
                <div>
                  <label className="text-sm font-medium block mb-1">Mood</label>
                  <div className="flex flex-wrap gap-2">
                    {["Happy", "Aesthetic", "Bold", "Romantic"].map((opt) => (
                      <Button
                        key={opt}
                        variant={mood === opt ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMood(opt)}
                      >
                        {opt}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium block mb-1">Description (optional)</label>
                <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Add context you want the AI to use…" />
              </div>

              {/* Generate button + error */}
              <div className="flex justify-center">
                <Button className="px-6 border-2" onClick={handleGenerate} disabled={loading}>
                  {loading ? "Generating…" : "✨ Generate"}
                </Button>
              </div>
              {error && <div className="text-sm text-red-500 text-center mt-2">{error}</div>}
            </CardContent>
          </Card>

          {/* Results: Caption+Hashtags & Songs */}
          <div ref={resultRef} className="space-y-4">
            <Card className="shadow">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Caption + Hashtags</CardTitle>
                {caption && (
                  <Button variant="ghost" size="sm" onClick={copyAll}>
                    {allCopied ? <><Check className="w-4 h-4 mr-1" /> Copied</> : <><Copy className="w-4 h-4 mr-1" /> Copy</>}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <p className="mb-3 whitespace-pre-wrap">{caption || "Your caption will appear here after you click Generate."}</p>
                <div className="text-sm text-muted-foreground">{hashtags.length ? hashtags.join(" ") : "Hashtags will appear here."}</div>
              </CardContent>
            </Card>

            <Card className="shadow">
              <CardHeader>
                <CardTitle>Song Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                {songs.length ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {songs.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Song ideas will appear here.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: History */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">History</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your past captions will show up here.</p>
          ) : (
            history.map((post) => (
              <Card key={post.id} className="shadow relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => setHistory((h) => h.filter((p) => p.id !== post.id))}
                >
                  <X className="w-4 h-4" />
                </Button>
                <CardContent className="p-3 flex gap-3">
                  <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                    {post.image ? (
                      isDataUrl(post.image) ? (
                        <Image src={post.image} alt="history" width={64} height={64} className="object-cover w-full h-full" />
                      ) : (
                        <Image src={post.image} alt="history" width={60} height={60} className="object-cover" />
                      )
                    ) : (
                      <div className="text-xs text-muted-foreground">No image</div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm line-clamp-2">{post.caption}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{post.hashtags.join(" ")}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{new Date(post.createdAt).toLocaleString()}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyHistory(post)}>
                        <Copy className="w-4 h-4 mr-1" /> Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}