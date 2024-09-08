import toast from "react-hot-toast";

const handleGetUserMediaError = (e: any) => {
  switch (e.name) {
    case "NotFoundError":
      toast.error(
        "Unable to open your call because no camera and/or microphone" +
          "were found."
      );
      break;
    case "SecurityError":
    case "PermissionDeniedError":
      // Do nothing; this is the same as the user canceling the call.
      break;
    default:
      toast.error(`Error opening your camera and/or microphone: ${e.message}`);
      break;
  }

    // closeVideoCall();
};

export { handleGetUserMediaError };
