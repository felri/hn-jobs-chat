export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      comments: {
        Row: {
          by: string;
          id: number;
          kids: number[];
          parent: number;
          text: string;
          time: Date; // Assuming you'll convert the UNIX timestamp to a JavaScript Date object.
          type: string;
          embeddings: number[];
        };
        Insert: {
          by?: string;
          id?: number;
          kids?: number[];
          parent?: number;
          text?: string;
          time?: Date; // Assuming you'll convert the UNIX timestamp to a JavaScript Date object.
          type?: string;
          embeddings?: number[];
        };
        Update: {
          by?: string;
          id?: number;
          kids?: number[];
          parent?: number;
          text?: string;
          time?: Date; // Assuming you'll convert the UNIX timestamp to a JavaScript Date object.
          type?: string;
          embeddings?: number[];
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      pricing_plan_interval: "day" | "week" | "month" | "year";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
