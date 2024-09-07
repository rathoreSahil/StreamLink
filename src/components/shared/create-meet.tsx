import { Button } from "@/components/ui/button";
import { useSocket } from "@/context/socket-provider";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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

    socket.emit(
      "create-meet",
      (err: string | null, response: { meetId: string }) => {
        if (err) {
          toast.error("Couldn't Create Meet! Try again");
          console.error(err);
          return;
        }
        toast.success(`Meet created with id: ${response.meetId}`);
        router.push(`/${response.meetId}`);
      }
    );
  }

  return <Button onClick={handleCreateMeet}>CreateMeet</Button>;
};

export default CreateMeet;
