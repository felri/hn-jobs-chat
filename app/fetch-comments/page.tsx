"use client";
import { saveCommentsFromStoriesByUser, queryVectorStore } from "./actions";
import { useEffect, useState } from "react";

export default function Chat() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [input, setInput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSendMesssage = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const comments = await queryVectorStore(input);
    console.log(comments);
    // setInput("");
    setComments(comments);
  };

  const fetchComments = async () => {
    const comments = await saveCommentsFromStoriesByUser("whoishiring");
    console.log(comments);
  };



  return (
    <div className="mx-auto w-full p-2 py-24 flex flex-col stretch">
      {/* button  */}
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={fetchComments}
      >
        Fetch Comments
      </button>
      <input
        className="fixed w-full bottom-0 border border-gray-300 rounded mb-8 shadow-xl p-2"
        value={input}
        placeholder="Say something..."
        onChange={handleInputChange}
      />
      {
        comments.map((comment, index) => {
          return (
            <div className="bg-white shadow-xl rounded p-2 mb-2 w-full" key={index}>
              <p className="w-full">{comment[0].pageContent}</p>
            </div>
          );
        })
      }
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={handleSendMesssage}
      >
        Send
      </button>
    </div>
  );
}
