import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocket } from "@/context/socket-provider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

const JoinMeet = () => {
  const socket = useSocket();
  const router = useRouter();
  const [meetId, setMeetId] = useState("");

  function handleJoinMeet() {
    if (!socket) {
      toast.error(
        "Something went wrong! Please Refresh the page and try again"
      );
      return;
    }

    socket.emit("join-meet", meetId, (response: { status: string }) => {
      router.push(`/${meetId}`);
      toast.success("Meet Joined");
      console.log(response.status);
    });
  }

  return (
    <>
      <Input
        placeholder="Enter Meet ID"
        value={meetId}
        onChange={(e) => setMeetId(e.target.value)}
      />
      <Button onClick={handleJoinMeet}>JoinMeet</Button>
    </>
  );
};

export default JoinMeet;
