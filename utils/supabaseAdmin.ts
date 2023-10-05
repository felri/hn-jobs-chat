import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types_db";

type Comment = Database["public"]["Tables"]["comments"]["Insert"];

type UpsertResponse = {
  success: boolean;
  data?: Comment[] | null;
  error?: string;
};

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export const upsertComment = async (
  comments: Comment[]
): Promise<UpsertResponse> => {
  const { data, error } = await supabaseAdmin
    .from("comments")
    .upsert(comments, {
      onConflict: "id", // This specifies what to do in case of conflict on the 'id' column.
    });

  if (error) {
    console.error("Error upserting comments:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    data,
  };
};
