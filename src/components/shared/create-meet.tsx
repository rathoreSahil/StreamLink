import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { usePoliteState } from "@/context/polite-state-provider";
import { useSocket } from "@/context/socket-provider";
import { useRouter } from "next/navigation";

const CreateMeet = () => {
  const socket = useSocket();
  const router = useRouter();
  const { setPolite } = usePoliteState();

  function handleCreateMeet() {
    if (!socket) {
      toast.error(
        "Something went wrong! Please Refresh the page and try again"
      );
      return;
    }

    socket.emit("create-meet", (response: { meetId: string }) => {
      router.push(`/${response.meetId}`);
      toast.success(`Meet created with id: ${response.meetId}`);
    });
    setPolite(false);
  }

  return <Button onClick={handleCreateMeet}>CreateMeet</Button>;
};

export default CreateMeet;
