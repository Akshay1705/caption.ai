export type Post = {
  id: number;
  image: string | null;
  caption: string;
  hashtags: string[];
  songs: string[];
  created_at: string;
};