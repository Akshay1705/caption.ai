"use client";

import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OutputAreaProps {
  caption: string;
  hashtags: string[];
  songs: string[];
  allCopied: boolean;
  resultRef: React.RefObject<HTMLDivElement | null>;
  copyAll: () => void;
}

export default function OutputArea({ caption, hashtags, songs, allCopied, resultRef, copyAll }: OutputAreaProps) {
  return (
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
          <div className="text-sm text-muted-foreground">
            {hashtags.length > 0
              ? hashtags.map((h) => `#${h}`).join(" ")
              : "Hashtags will appear here."}
          </div>
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
  );
}