"use client";
import { saveCommentsFromStoriesByUser } from "./actions";
import { useEffect, useState } from "react";

export default function Chat() {
  const [comments, setComments] = useState([]);

  const fetchComments = async () => {
    const comments = await saveCommentsFromStoriesByUser("whoishiring");
    console.log(comments);
  };

  useEffect(() => {
    fetchComments();
  }, []);

  return (
    <div className="mx-auto w-full max-w-md py-24 flex flex-col stretch">
      {/* button  */}
    </div>
  );
}
