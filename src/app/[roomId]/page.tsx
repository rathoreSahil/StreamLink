"use client";

import { Button } from "@/components/ui/button";
import { useSocket } from "@/context/socket-provider";
import { handleGetUserMediaError } from "@/webrtc/error";
import { createPeerConnection, getUserMedia } from "@/webrtc/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaPhoneSlash } from "react-icons/fa";
import { FaVideo } from "react-icons/fa";
import { FaMicrophone } from "react-icons/fa";

type MeetParams = {
  params: { roomId: string };
};

const Meet = ({ params }: MeetParams) => {
  const { roomId } = params;
  const router = useRouter();
  const socket = useSocket();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>();

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
      }

      track.onunmute = () => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
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
    <>
      <div className="flex gap-4 py-4">
        <video
          className="flex-1 rounded-lg"
          ref={localVideoRef}
          autoPlay
          muted
        ></video>
        <video
          className="flex-1 rounded-lg"
          ref={remoteVideoRef}
          autoPlay
        ></video>
      </div>
      <div className="flex items-center justify-center gap-4 py-4">
        <Button
          // variant="secondary"
          // onClick={closeVideoCall}
          className="rounded-full h-12 w-12 px-[14px]"
        >
          <FaVideo className="h-8 w-8" />
        </Button>
        <Button
          variant="secondary"
          // onClick={closeVideoCall}
          className="rounded-full h-12 w-12"
        >
          <FaMicrophone className="h-8 w-8" />
        </Button>
        <Button
          variant="destructive"
          onClick={closeVideoCall}
          className="rounded-full h-12 w-12 px-[14px]"
        >
          <FaPhoneSlash className="h-8 w-8" />
        </Button>
      </div>
    </>
  );
};

export default Meet;
