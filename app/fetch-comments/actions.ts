"use server";

import { searchStoriesByUser, getStory, getComment } from "@/utils/hnHelpers";
import { upsertComment, supabaseAdmin } from "@/utils/supabaseAdmin";
import {
  SupabaseFilter,
  SupabaseFilterRPCCall,
  SupabaseVectorStore,
} from "langchain/vectorstores/supabase";
import { DEFAULT_PROMPT, CATEGORY_PROMPT } from "@/utils/prompts";
import { PromptTemplate } from "langchain/prompts";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Database } from "@/types_db";
import { unixTimestampToYMD, chunkArray } from "@/utils/helpers";
import { OpenAI } from "langchain/llms/openai";
import { AttributeInfo } from "langchain/schema/query_constructor";
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import { SupabaseTranslator } from "langchain/retrievers/self_query/supabase";
import {
  Comparators,
  Comparison,
  Operation,
  Operators,
  StructuredQuery,
} from "langchain/chains/query_constructor/ir";

/**
 * Converts a `SupabaseMetadata` object into a `StructuredQuery` object.
 * The function creates a new `StructuredQuery` object and uses the
 * `Operation` and `Comparison` classes to build the query.
 */

export type SupabaseMetadata = Record<string, any>;

type Comment = Database["public"]["Tables"]["comments"]["Insert"];

const attributeInfo: AttributeInfo[] = [
  {
    name: "year",
    description: "The year the job was posted",
    type: "number",
  },
  {
    name: "month",
    description: "The month the job was posted",
    type: "number",
  },
  {
    name: "day",
    description: "The day the job was posted",
    type: "number",
  },
];

export async function generateEmbeddingDocuments(text: string): Promise<any> {
  console.log(`Generating embedding for text`);
  const embeddings = new OpenAIEmbeddings();

  const data = await embeddings.embedDocuments([text]);

  return data[0];
}

export async function generateEmbeddingQuery(text: string): Promise<any> {
  console.log(`Generating embedding for text`);
  const embeddings = new OpenAIEmbeddings();

  const data = await embeddings.embedQuery(text);

  return data;
}

export async function categorizeComment(query: string): Promise<{
  keywords: string[];
  position: string;
  location: string;
  remote: boolean;
}> {
  const llm = new OpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
  });

  const YYYYMMDD = new Date().toISOString().slice(0, 10);
  const prompt = new PromptTemplate({
    template: CATEGORY_PROMPT,
    inputVariables: ["query"],
  });

  const formattedPrompt = await prompt.format({
    query,
  });

  const stringQuery = await llm.call(formattedPrompt);

  console.log(stringQuery);

  const rawJsonQuery = JSON.parse(stringQuery);

  return rawJsonQuery;
}

export async function saveCommentsFromStoriesByUser(
  username: string
): Promise<void> {
  const stories = await searchStoriesByUser(username);
  const first5Stories = stories.slice(0, 5);
  for (const story of first5Stories) {
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

      const N = 100; // for example, change this to any desired batch size
      const pageComments = [];

      if (storyDetail.kids) {
        for (const kidId of storyDetail.kids) {
          console.log(`Fetching comment ID ${kidId}...`);
          const comment = await getComment(kidId);
          if (comment && comment.text) {
            comment.html = comment.text;
            comment.content = comment.text.replace(/<\/?[^>]+(>|$)/g, " ");
            comment.user = comment.by;
            comment.embeddings = await generateEmbeddingDocuments(
              comment.content
            );
            comment.token_count = comment.content.split(" ").length;
            comment.timestamp = unixTimestampToYMD(comment.time);

            const categoriesFromLlm = await categorizeComment(comment.content);
            console.log(categoriesFromLlm);
            const [year, month, day] = comment.timestamp.split("-");
            comment.metadata = {
              year: parseInt(year),
              month: parseInt(month),
              ...categoriesFromLlm,
            };

            delete comment.text;
            delete comment.by;
            delete comment.time;

            pageComments.push(comment);

            if (pageComments.length >= N) {
              console.log(`Upserting ${N} comments...`);
              await upsertComment(pageComments.splice(0, N)); // Upserts N comments and removes them from pageComments
            }
          }
        }
      } else {
        console.log(`No comments found for story: ${story.title}`);
      }

      if (pageComments.length) {
        console.log(`Upserting remaining ${pageComments.length} comments...`);
        await upsertComment(pageComments); // Upserts any remaining comments that are less than N
      }
    }
  }
}

export async function queryVectorStore(text: string): Promise<any> {
  const embeddings = new OpenAIEmbeddings();
  const llm = new OpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
  });

  const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
    client: supabaseAdmin,
    tableName: "comments",
  });

  const YYYYMMDD = new Date().toISOString().slice(0, 10);
  const prompt = new PromptTemplate({
    template: DEFAULT_PROMPT,
    inputVariables: ["query", "currentDate"],
  });

  const formattedPrompt = await prompt.format({
    query: text,
    currentDate: YYYYMMDD,
  });

  const stringQuery = await llm.call(formattedPrompt);
  const rawJsonQuery = JSON.parse(stringQuery);

  const { filter, query } = rawJsonQuery;
  const andFilters = filter?.and;

  if (!andFilters || andFilters.length === 0) {
    throw new Error("No valid filters found");
  }

  const createSupabaseFilter =
    (
      comparator: string,
      attribute: string,
      value: number | string
    ): SupabaseFilterRPCCall =>
    (rpc) => {
      let valueType = "string"; // default
      if (Number.isInteger(value)) {
        valueType = "int";
      } else if (typeof value === "number") {
        valueType = "float";
      }
      return rpc.filter(
        `metadata->${attribute}::${valueType}`,
        comparator,
        value
      );
    };

  let filterFunctions: SupabaseFilterRPCCall[] = [];

  console.log(andFilters);

  for (const [comparator, attribute, value] of andFilters) {
    filterFunctions.push(createSupabaseFilter(comparator, attribute, value));
  }

  const firstAndFilter = createSupabaseFilter(
    andFilters[0][0],
    andFilters[0][1],
    andFilters[0][2]
  );

  // Apply filters sequentially
  const combinedFilterFunction: SupabaseFilterRPCCall = (rpc) =>
    filterFunctions.reduce(
      (currentRpc, filterFunction) => filterFunction(currentRpc),
      rpc
    );

  // Use combinedFilterFunction wherever you want in the Supabase query
  // For instance:

  const queryEmbedding = await generateEmbeddingQuery(query);

  console.log(queryEmbedding);
  console.log(query);
  const { data } = await supabaseAdmin.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: 10,
  });

  // console.log(data);

  // return data;

  console.log("firstAndFilter", firstAndFilter);

  const result = await vectorStore.similaritySearchVectorWithScore(
    queryEmbedding,
    20,
    firstAndFilter
  );

  // sort by score
  result.sort((a, b) => {
    return b[1] - a[1];
  });

  return result;
}

// const formattedQuery = convertObjectFilterToStructuredQuery(rawJsonQuery);
// console.log(JSON.stringify(formattedQuery));

// const translator = new SupabaseTranslator();
// const structuredQuery = translator.visitStructuredQuery(formattedQuery);
// console.log(JSON.stringify(structuredQuery));

// console.log(console.log(structuredQuery.filter));

// const selfQueryRetriever = await SelfQueryRetriever.fromLLM({
//   llm,
//   vectorStore,
//   verbose: true,
//   documentContents,
//   attributeInfo,
//   structuredQueryTranslator: new SupabaseTranslator(),
// });
// console.log("-----------------");
// console.log(selfQueryRetriever.llmChain.prompt);
// console.log("-----------------");

// const results = await selfQueryRetriever.getRelevantDocuments(text);
// console.log(results);
// return results;
