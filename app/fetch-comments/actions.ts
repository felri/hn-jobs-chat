"use server";

import { searchStoriesByUser, getStory, getComment } from "@/utils/hnHelpers";
import { upsertComment } from "@/utils/supabaseAdmin";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Database } from "@/types_db";
import { unixTimestampToYMD } from "@/utils/helpers";

type Comment = Database["public"]["Tables"]["comments"]["Insert"];

export async function generateEmbedding(text: string): Promise<any> {
  console.log(`Generating embedding for text`);
  const embeddings = new OpenAIEmbeddings();

  const data = await embeddings.embedDocuments([text]);

  return data[0];
}

export async function saveCommentsFromStoriesByUser(
  username: string
): Promise<void> {
  const stories = await searchStoriesByUser(username);
  for (const story of [stories[0]]) {
    const pageComments: Comment[] = [];
    if (story.objectID && story.title) {
      console.log(`Fetching comments for story: ${story.title}...`);
      const storyDetail = await getStory(story.objectID);

      if (!storyDetail) {
        console.log(
          `Couldn't fetch details for story ID ${story.objectID}. Continuing to next story.`
        );
        continue;
      }

      if (storyDetail.kids) {
        for (const kidId of storyDetail.kids.slice(0, 10)) {
          console.log(`Fetching comment ID ${kidId}...`);
          const comment = await getComment(kidId);
          if (comment && comment.text) {
            const embedding = await generateEmbedding(comment.text);
            comment.embeddings = embedding;
            comment.time = unixTimestampToYMD(comment.time);
            pageComments.push(comment);
          }
        }
      } else {
        console.log(`No comments found for story: ${story.title}`);
      }
    }
    if (pageComments.length) {
      console.log(`Upserting ${pageComments.length} comments...`);
      await upsertComment(pageComments);
    }
  }
}
