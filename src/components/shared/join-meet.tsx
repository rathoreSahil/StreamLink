import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocket } from "@/context/socket-provider";
import { cn } from "@/lib/utils";
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
    router.push(`/${meetId}`);
    toast.success("Meet Joined");
  }

  return (
    <div className="flex gap-4">
      <Input
        placeholder="Enter Meet ID"
        value={meetId}
        onChange={(e) => setMeetId(e.target.value)}
        className="border-0 border-b border-primary focus-visible:ring-0"
      />
      <Button
        className="p-[3px] relative rounded-lg"
        onClick={handleJoinMeet}
        disabled={meetId.length === 0}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
        <div className="px-4 py-2  bg-black rounded-[6px]  relative group transition duration-200 text-white hover:bg-transparent">
          JOIN
        </div>
      </Button>
    </div>
  );
};

export default JoinMeet;
