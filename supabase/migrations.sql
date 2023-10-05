create or replace function "match_comments_sections"(embedding vector(1536), match_threshold float, match_count int, min_content_length int)
returns table (id bigint, content text, similarity float)
language plpgsql
as $$
#variable_conflict use_variable
begin
  return query
  select
    comments.id,
    comments.content,
    (comments.embeddings <#> embedding) * -1 as similarity
  from comments

  -- We only care about sections that have a useful amount of content
  where length(comments.content) >= min_content_length

  -- The dot product is negative because of a Postgres limitation, so we negate it
  and (comments.embeddings <#> embedding) * -1 > match_threshold

  -- OpenAI embeddings are normalized to length 1, so
  -- cosine similarity and dot product will produce the same results.
  -- Using dot product which can be computed slightly faster.
  --
  -- For the different syntaxes, see https://github.com/pgvector/pgvector
  order by comments.embeddings <#> embedding
  
  limit match_count;
end;
$$;

create function match_documents (
  query_embedding vector(1536),
  match_count int DEFAULT null,
  filter jsonb DEFAULT '{}'
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (comments.embeddings <=> query_embedding) as similarity
  from comments
  where metadata @> filter
  order by comments.embeddings <=> query_embedding
  limit match_count;
end;
$$;