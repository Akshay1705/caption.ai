export type Post = {
  id: number;
  image: string | null;
  caption: string;
  hashtags: string[];
  songs: string[];
  createdAt: string;
};