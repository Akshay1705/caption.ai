"use client";

import Image from "next/image";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface InputAreaProps {
  image: string | null;
  style: string;
  subject: string;
  occasion: string;
  mood: string;
  desc: string;
  loading: boolean;
  error: string | null;
  setImage: (image: string | null) => void;
  setStyle: (style: string) => void;
  setSubject: (subject: string) => void;
  setOccasion: (occasion: string) => void;
  setMood: (mood: string) => void;
  setDesc: (desc: string) => void;
  handleGenerate: () => void;
}

const options = {
    style: ["Poetic", "Funny", "Inspiring"],
    subject: ["Selfie", "Food", "Travel", "Fashion"],
    occasion: ["Birthday", "Party", "Wedding", "Vacation"],
    mood: ["Happy", "Aesthetic", "Bold", "Romantic"],
};

export default function InputArea({
  image, style, subject, occasion, mood, desc, loading, error,
  setImage, setStyle, setSubject, setOccasion, setMood, setDesc, handleGenerate
}: InputAreaProps) {
    
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

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle>Upload & Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium block mb-2">Photo</label>
          <label
            htmlFor="image"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-primary hover:bg-muted/5 transition p-4 overflow-hidden"
          >
            {image ? (
              <Image src={image} alt="preview" width={500} height={50} className="object-cover w-full h-full rounded" />
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className="text-sm font-medium block mb-1">Style</label>
                <div className="flex flex-wrap gap-2">
                    {options.style.map((opt) => (<Button key={opt} variant={style === opt ? "default" : "outline"} size="sm" onClick={() => setStyle(opt)}>{opt}</Button>))}
                </div>
            </div>
            <div>
                <label className="text-sm font-medium block mb-1">Subject</label>
                <div className="flex flex-wrap gap-2">
                    {options.subject.map((opt) => (<Button key={opt} variant={subject === opt ? "default" : "outline"} size="sm" onClick={() => setSubject(opt)}>{opt}</Button>))}
                </div>
            </div>
            <div>
                <label className="text-sm font-medium block mb-1">Occasion</label>
                <div className="flex flex-wrap gap-2">
                    {options.occasion.map((opt) => (<Button key={opt} variant={occasion === opt ? "default" : "outline"} size="sm" onClick={() => setOccasion(opt)}>{opt}</Button>))}
                </div>
            </div>
            <div>
                <label className="text-sm font-medium block mb-1">Mood</label>
                <div className="flex flex-wrap gap-2">
                    {options.mood.map((opt) => (<Button key={opt} variant={mood === opt ? "default" : "outline"} size="sm" onClick={() => setMood(opt)}>{opt}</Button>))}
                </div>
            </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Description (optional)</label>
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Add context you want the AI to use…" />
        </div>

        <div className="flex justify-center">
          <Button className="px-6 border-2" onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating…" : "✨ Generate"}
          </Button>
        </div>
        {error && <div className="text-sm text-red-500 text-center mt-2">{error}</div>}
      </CardContent>
    </Card>
  );
}