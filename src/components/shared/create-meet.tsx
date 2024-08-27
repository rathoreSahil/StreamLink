import { Button } from "@/components/ui/button";
import { useSocket } from "@/context/socket-provider";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const CreateMeet = () => {
  const socket = useSocket();
  const router = useRouter();

  function handleCreateMeet() {
    if (!socket) {
      toast.error("Socket is not available");
      return;
    }

    socket.emit("create-meet", (meetId: string) => {
      toast.success(`Meet created with id: ${meetId}`);
      router.push(`/${meetId}`);
    });
  }

  return <Button onClick={handleCreateMeet}>CreateMeet</Button>;
};

export default CreateMeet;
