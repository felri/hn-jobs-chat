const HN_ALGOLIA_BASE_URL = "http://hn.algolia.com/api/v1";
const HN_FIREBASE_BASE_URL = "https://hacker-news.firebaseio.com/v0";

export async function getComment(commentId: number): Promise<any> {
  const response = await fetch(
    `${HN_FIREBASE_BASE_URL}/item/${commentId}.json`
  );
  return await response.json();
}

export async function getStory(storyId: number): Promise<any> {
  const response = await fetch(`${HN_FIREBASE_BASE_URL}/item/${storyId}.json`);
  return await response.json();
}

export async function searchStoriesByUser(username: string): Promise<any[]> {
  let page = 0;
  let allHits: any[] = [];

  while (true) {
    console.log(`Fetching page ${page} of stories by user ${username}...`);
    const response = await fetch(
      `${HN_ALGOLIA_BASE_URL}/search?tags=story,author_${username}&page=${page}`
    );
    const data = await response.json();
    const hits = data.hits || [];

    if (!hits.length || page >= 1) {
      console.log(
        `No more stories found after page ${page} for user ${username}.`
      );
      break;
    }

    allHits = [...allHits, ...hits];
    page += 1;
  }

  return allHits;
}