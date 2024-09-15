import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/context/socket-provider";
import { useRouter } from "next/navigation";

const CreateMeet = () => {
  const socket = useSocket();
  const router = useRouter();

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
  }

  return (
    <Button
      className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white px-4 py-2"
      onClick={handleCreateMeet}
    >
      CREATE
    </Button>
  );
};

export default CreateMeet;
