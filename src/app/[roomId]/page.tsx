"use client";

import { Button } from "@/components/ui/button";
import { useSocket } from "@/context/socket-provider";
import { handleGetUserMediaError } from "@/webrtc/error";
import {
  createPeerConnection,
  getMediaDevicesInfo,
  getUserMedia,
} from "@/webrtc/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaPhoneSlash } from "react-icons/fa";
import { FaVideo } from "react-icons/fa";
import { FaMicrophone } from "react-icons/fa";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronUp } from "lucide-react";

type MeetParams = {
  params: { roomId: string };
};

const Meet = ({ params }: MeetParams) => {
  const { roomId } = params;
  const router = useRouter();
  const socket = useSocket();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [audioInputElements, setAudioInputElements] = useState(
    [] as MediaDeviceInfo[]
  );
  const [audioOutputElements, setAudioOutputElements] = useState(
    [] as MediaDeviceInfo[]
  );
  const [videoInputElements, setVideoInputElements] = useState(
    [] as MediaDeviceInfo[]
  );

  const [selectedAudioInputElement, setSelectedAudioInputElement] = useState({
    label: "Default Input",
  } as MediaDeviceInfo);
  const [selectedAudioOutputElement, setSelectedAudioOutputElement] = useState({
    label: "Default Output",
  } as MediaDeviceInfo);
  const [selectedVideoInputElement, setSelectedVideoInputElement] = useState({
    label: "Default Input",
  } as MediaDeviceInfo);

  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>();

  useEffect(() => {
    console.log({
      audioInputElements,
      audioOutputElements,
      videoInputElements,
    });
  }, [audioInputElements, audioOutputElements, videoInputElements]);

  useEffect(() => {
    socket?.emit("join-room", roomId);
  }, [roomId, socket]);

  useEffect(() => {
    createPeerConnection()
      .then((pc) => {
        setPeerConnection(pc);
      })
      .catch((error) => {
        console.error(error);
        toast.error("Error creating peer connection");
      });
  }, []);

  useEffect(() => {
    if (!peerConnection) return;

    getUserMedia()
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });
      })
      .catch((error) => {
        console.error(error);
        handleGetUserMediaError(error);
      });
  }, [peerConnection]);

  useEffect(() => {
    const updateDeviceList = () => {
      const { audioInputList, audioOutputList, videoInputList } =
        getMediaDevicesInfo();
      setAudioInputElements(audioInputList);
      setAudioOutputElements(audioOutputList);
      setVideoInputElements(videoInputList);
    };

    updateDeviceList();
    navigator.mediaDevices.ondevicechange = () => {
      updateDeviceList();
    };

    return () => {
      navigator.mediaDevices.ondevicechange = null;
    };
  }, []);

  useEffect(() => {
    if (!peerConnection) return;

    peerConnection.onnegotiationneeded = async () => {
      try {
        await peerConnection.setLocalDescription();
        socket?.emit("signal", roomId, {
          description: peerConnection.localDescription,
        });
      } catch (err) {
        toast.error("Error creating offer");
        console.error(err);
      }
    };

    return () => {
      peerConnection.onnegotiationneeded = null;
    };
  }, [peerConnection, roomId, socket]);

  useEffect(() => {
    if (!peerConnection) return;
    peerConnection.onicecandidate = ({ candidate }) => {
      socket?.emit("signal", roomId, { candidate });
    };

    return () => {
      peerConnection.onicecandidate = null;
    };
  }, [peerConnection, roomId, socket]);

  useEffect(() => {
    if (!socket) return;
    socket.on("signal", async ({ description, candidate }) => {
      try {
        if (!peerConnection) return;
        if (description) {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(description)
          );
          if (description.type === "offer") {
            await peerConnection.setLocalDescription();
            socket.emit("signal", roomId, {
              description: peerConnection.localDescription,
            });
          }
        } else if (candidate) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      socket.off("signal");
    };
  }, [peerConnection, roomId, socket]);

  useEffect(() => {
    if (!peerConnection) return;
    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === "failed") {
        peerConnection.restartIce();
      }
    };

    return () => {
      peerConnection.oniceconnectionstatechange = null;
    };
  }, [peerConnection]);

  useEffect(() => {
    if (!peerConnection) return;
    peerConnection.ontrack = ({ track, streams: [stream] }) => {
      if (track.enabled && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.classList.remove("hidden");
      }

      track.onunmute = () => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.classList.remove("hidden");
        }
      };

      track.onmute = () => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
          remoteVideoRef.current.classList.add("hidden");
        }
      };

      track.onended = () => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
          remoteVideoRef.current.classList.add("hidden");
        }
      };
    };

    return () => {
      peerConnection.ontrack = null;
    };
  }, [peerConnection]);

  const closeVideoCall = useCallback(() => {
    if (peerConnection) {
      peerConnection.ontrack = null;
      peerConnection.onicecandidate = null;
      peerConnection.oniceconnectionstatechange = null;
      peerConnection.onsignalingstatechange = null;
      peerConnection.onicegatheringstatechange = null;
      peerConnection.onnegotiationneeded = null;

      if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
        (remoteVideoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());

        remoteVideoRef.current.src = "";
        remoteVideoRef.current.srcObject = null;
      }

      if (localVideoRef.current && localVideoRef.current.srcObject) {
        (localVideoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());

        localVideoRef.current.src = "";
        localVideoRef.current.srcObject = null;
      }

      peerConnection.close();
      setPeerConnection(null);
    }
    router.push("/");
  }, [peerConnection, router]);

  useEffect(() => {
    if (!peerConnection) return;
    peerConnection.oniceconnectionstatechange = (event) => {
      switch (peerConnection.iceConnectionState) {
        case "closed":
        case "failed":
          closeVideoCall();
          break;
      }
    };
  }, [closeVideoCall, peerConnection]);

  return (
    <div className="flex flex-col h-lvh py-4">
      <div className="flex flex-1 justify-center gap-4 px-16 py-4">
        <video
          className="object-cover w-full max-h-[85vh] rounded-lg"
          ref={localVideoRef}
          autoPlay
          muted
        ></video>
        <video
          className="rounded-lg hidden"
          ref={remoteVideoRef}
          autoPlay
        ></video>
      </div>
      <div className="flex items-center justify-center gap-4 py-2 px-4 bg-zinc-900 h-[8vh]">
        <div className="flex items-center justify-normal rounded-full pl-3 gap-1 bg-zinc-700">
          <Popover>
            <PopoverTrigger>
              <ChevronUp />
            </PopoverTrigger>
            <PopoverContent className="rounded-full border-none px-0 py-0 mb-6 w-min">
              <Select>
                <SelectTrigger className="w-48 rounded-full focus:ring-0">
                  <SelectValue placeholder={selectedVideoInputElement.label} />
                </SelectTrigger>
                <SelectContent>
                  {...videoInputElements.map((el, idx) => {
                    return (
                      <SelectItem key={idx} value={el.deviceId}>
                        {el.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </PopoverContent>
          </Popover>

          <Button className="rounded-full h-12 w-12 px-[14px]">
            <FaVideo className="h-8 w-8" />
          </Button>
        </div>
        <div className="flex items-center justify-normal rounded-full pl-3 gap-1 bg-zinc-700">
          <Popover>
            <PopoverTrigger>
              <ChevronUp />
            </PopoverTrigger>
            <PopoverContent className="bg-gray-800 rounded-full border-none px-2 py-1 mb-6 flex items-center justify-center gap-2">
              <Select>
                <SelectTrigger className="w-48 rounded-full focus-visible:ring-0 focus:ring-0">
                  <SelectValue placeholder={selectedAudioInputElement.label} />
                </SelectTrigger>
                <SelectContent>
                  {audioInputElements.map((el, idx) => {
                    return (
                      <SelectItem key={idx} value={el.deviceId}>
                        {el.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-48 rounded-full focus:ring-0">
                  <SelectValue placeholder={selectedAudioOutputElement.label} />
                </SelectTrigger>
                <SelectContent>
                  {audioOutputElements.map((el, idx) => {
                    return (
                      <SelectItem key={idx} value={el.deviceId}>
                        {el.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </PopoverContent>
          </Popover>
          <Button variant="secondary" className="rounded-full h-12 w-12">
            <FaMicrophone className="h-8 w-8" />
          </Button>
        </div>
        <Button
          variant="destructive"
          onClick={closeVideoCall}
          className="rounded-full h-12 w-12 px-[14px]"
        >
          <FaPhoneSlash className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
};

export default Meet;
