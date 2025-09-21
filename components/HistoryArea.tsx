"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Post } from "@/types"; // Import the shared type

interface HistoryAreaProps {
  history: Post[];
  handleDelete: (id: number) => void;
}

export default function HistoryArea({ history, handleDelete }: HistoryAreaProps) {
    
  const isDataUrl = (s?: string | null) => !!s && s.startsWith("data:");
    
  return (
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
              onClick={() => handleDelete(post.id)}
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
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}