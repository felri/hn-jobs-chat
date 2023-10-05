export const DEFAULT_PROMPT = `Your goal is to structure the user's query to match the request schema provided below.
<< Structured Request Schema >>
When responding use a markdown code snippet with a JSON object formatted in the following schema:
{{
    "query": string \\ text string to compare to document contents
    "filter": string \\ logical condition statement for filtering documents
}}

The query string should contain only text that is expected to match the contents of
documents. Any conditions in the filter should not be mentioned in the query as well.

A logical condition statement is composed of one or more comparison and logical \
operation statements.

A comparison statement takes the form: ["comp"["attr", "val"]]:
- comp [eq, ne, lt, gt, lte, gte]: comparator
- attr [string]:  name of attribute to apply the comparison to
- val [string]: is the comparison value

A logical operation statement takes the form ["op"["statement1", "statement2", ...]]:
- op [and, or]: logical operator
- statement1, statement2, ... (comparison statements or logical operation
statements): one or more statements to apply the operation to

Make sure that you only use the comparators and logical operators listed above and no others.
Make sure that filters only refer to attributes that exist in the data source.
Make sure that filters only use the attributed names with its function names if there are functions applied on them.
Make sure that filters take into account the descriptions of attributes and only make comparisons that are feasible given the type of data being stored.
Make sure that filters are only used as needed. If there are no filters that should be applied return a filter of the current year based on the CURRENT_DATE using gte (Greater Than or Equal)
Make sure that related keywords are added to the query string. For example, if the query is about a python position, make sure that the query contains keywords like "backend", "data science", etc.

<< Example 1. >>
User Query:
I'm looking for a next js position in the bay area
Structured Request:
{{
    "query": "react, bay area, frontend, next js",
    "filter": {{
        "and": [
            ["gte", "year", 2023],
        ]
    }}
}}

<< Example 2. >>
User Query:
I'm a backend dev, I know python and c# and I only work remote, show me jobs from the past 2 months
Structured Request:
{{"query":"python, c#, remote, backend","filter":{{
    "and": [
        ["gte", "year", 2023],
        ["gte", "month", 8]
    ]
}}

<< Example 3. >>
User Query:
I'm looking for a fastapi position, i would prefer remote and from 2020
Structured Request:
{{"query":"python, fastapi, remote, backend","filter":{{
    "and": [
        ["gte", "year", 2023],
        ["gte", "month", 8]
    ]
}}

Data Source:
{{"content":"Job positions","attributes": {{"year": {{"type":"integer","description":"The year the job was posted"}},"month": {{"type":"integer","description":"The month the job was posted"}}}}

CURRENT_DATE: {currentDate}

<< Example 4. >>
Data Source:
{{"content":"Job positions","attributes": {{"year": {{"type":"integer","description":"The year the job was posted"}},"month": {{"type":"integer","description":"The month the job was posted"}}}}
CURRENT_DATE: {currentDate}
User Query: {query}
Structured Request:`;

export const CATEGORY_PROMPT = `
A job posting will be provided, your goal is to structure the job posting to match the request schema provided below.
<< Example 1. >>
Job Posting:
OmniCar.dk | Copenhagen, Denmark | ONSITE | Fullstack Senior Javascript Developer with a side of DevOps | Node.js | React | Google Cloud | Pub&#x2F;Sub | Event Sourcing Targeting automotive importers and dealerships we are building a highly scalable application suite comprised of Node.js based micro services, using CQRS and Event Sourcing hosted on Google Cloud. The frontend is built on statically type checked Javascript with React, Redux and Webpack. For more detail see the listing here: https:&#x2F;&#x2F;www.linkedin.com&#x2F;jobs&#x2F;cap&#x2F;view&#x2F;226034493?pathWildcar... Or contact Claus Stilborg cs@omnicar.dk

Output:
{{
  keywords: ["Node.js", "React", "Google Cloud", "Pub/Sub", "Event Sourcing"],
  position: "Fullstack Senior Javascript Developer",
  location: "Copenhagen, Denmark",
}}

<< Example 2. >>
Dave.com | Senior Full Stack &amp; Front end Engineers | Los Angeles, CA | &quot;Onsite&quot; only, relocation available | Full time Dave.com is building products banks won&#x27;t to improve our customers&#x27; financial lives. We&#x27;ve built a mobile app that predicts your &quot;lowest balance until payday&quot; and offers a zero-interest paycheck advance as an alternative to paying an overdraft fee. As the job market is disintegrating around us, Dave is uniquely positioned to help our customers manage their finances and avert financial hardship. In the last two years, we&#x27;ve grown from 10,000 users to 5,000,000 and 12 employees to 100 (engineering accounts for about 50%). We&#x27;re well funded, cash flow positive, and growing quickly. We&#x27;re all WFH right now, but unfortunately still only looking for engineers who would be able to work on site in our LA office once the apocalypse is over. We&#x27;re looking for engineers to work on all parts of our stack (buzzwords include: Typescript, Node, React Native, MySQL, Spanner, Dataflow, and Google Cloud). If you&#x27;re interested, please email me directly: dick@dave.com

Output:
{{
  "keywords": ["Node.js", "React", "Google Cloud", "Pub/Sub", "Typescript", "MySQL"],
  "position": "Fullstack Senior Javascript Developer",
  "location": "Copenhagen, Denmark",
  "remote": false
}}

<< Example 3. >>
Framework | Burlingame, CA (flexibility for WFH) | Senior Backend Developer | Full time Framework’s mission is to fix consumer electronics. We believe products can be better both for users and the environment by building them to have long usage lifetimes and designed-in serviceability. Unlike most electronics products on the market today, ours are modular and can be repaired and upgraded by the average user. Our team comes from successful consumer electronics startups including the founding team of Oculus and e-commerce companies, and we’re funded to fulfill our mission. We&#x27;re hiring a Senior Backend Developer to lead development of our marketplace using Ruby on Rails and Solidus. We&#x27;re a (currently) small team with a big mission, so there is an enormous amount of ownership and influence that goes with this position.

Output:
{{
  "keywords": ["Ruby on Rails", "Solidus"],
  "position": "Senior Backend Developer",
  "location": "Burlingame, CA",
  "remote": true
}}

<< Example 4. >>
{query}

Output:
`;
