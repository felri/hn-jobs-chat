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
          content: string;
          timestamp: Date;
          type: string;
          embeddings: number[];
          token_count: number;
          metadata: Json;
          html: string;
        };
        Insert: {
          by?: string;
          id?: number;
          kids?: number[];
          parent?: number;
          content?: string;
          timestamp?: Date;
          type?: string;
          embeddings?: number[];
          token_count?: number;
          metadata?: Json;
          html?: string;
        };
        Update: {
          by?: string;
          id?: number;
          kids?: number[];
          parent?: number;
          content?: string;
          timestamp?: Date;
          type?: string;
          embeddings?: number[];
          token_count?: number;
          metadata?: Json;
          html?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_comments_sections: {
        Params: {
          embedding: string;
          match_threshold: number;
          match_count: number;
          min_content_length: number;
        };
        Return: {
          id: number;
          by?: string;
          content: string;
          timestamp?: Date;
          type?: string;
          embeddings?: number[];
          token_count?: number;
        }[];
      };
      match_documents: {
        Params: {
          query_embedding: string;
          match_count: number;
          filter: Json;
        };
        Return: {
          id: number;
          content: string;
          similarity: number;
          metadata?: Json;
        }[];
      };
    };
    Enums: {
      pricing_plan_interval: "day" | "week" | "month" | "year";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
