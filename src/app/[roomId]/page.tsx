"use client";

import { Button } from "@/components/ui/button";
import { usePoliteState } from "@/context/polite-state-provider";
import { useSocket } from "@/context/socket-provider";
import { handleGetUserMediaError } from "@/webrtc/error";
import { createPeerConnection, getUserMedia } from "@/webrtc/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

type MeetParams = {
  params: { roomId: string };
};

const Meet = ({ params }: MeetParams) => {
  const socket = useSocket();
  const { polite } = usePoliteState();

  const makingOffer = useRef(false);
  const ignoreOffer = useRef(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const hangupButtonRef = useRef<HTMLButtonElement>(null);

  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>();

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
        makingOffer.current = true;
        await peerConnection.setLocalDescription();
        socket?.emit("signal", {
          description: peerConnection.localDescription,
        });
      } catch (err) {
        toast.error("Error creating offer");
        console.error(err);
      } finally {
        makingOffer.current = false;
      }
    };
  }, [peerConnection, socket]);

  useEffect(() => {
    if (!peerConnection) return;
    peerConnection.onicecandidate = ({ candidate }) => {
      socket?.emit("signal", { candidate });
    };
  }, [peerConnection, socket]);

  useEffect(() => {
    if (!socket) return;
    socket.on("signal", async ({ description, candidate }) => {
      try {
        if (!peerConnection) return;
        if (description) {
          const offerCollision =
            description.type === "offer" &&
            (makingOffer.current || peerConnection.signalingState !== "stable");

          ignoreOffer.current = !polite && offerCollision;
          if (ignoreOffer) {
            return;
          }

          await peerConnection.setRemoteDescription(description);
          if (description.type === "offer") {
            await peerConnection.setLocalDescription();
            socket.emit("signal", {
              description: peerConnection.localDescription,
            });
          }
        } else if (candidate) {
          try {
            await peerConnection.addIceCandidate(candidate);
          } catch (err) {
            if (!ignoreOffer) {
              throw err;
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      socket.off("signal");
    };
  }, [peerConnection, polite, socket]);

  useEffect(() => {
    if (!peerConnection) return;
    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === "failed") {
        peerConnection.restartIce();
      }
    };
  }, [peerConnection]);

  useEffect(() => {
    if (!peerConnection) return;
    peerConnection.ontrack = ({ track, streams: [stream] }) => {
      track.onunmute = () => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      };
    };

    if (hangupButtonRef.current) {
      hangupButtonRef.current.disabled = false;
    }
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

    if (hangupButtonRef.current) {
      hangupButtonRef.current.disabled = true;
    }
  }, [peerConnection]);

  useEffect(() => {
    if (!socket) return;

    socket.on("hang-up", () => {
      closeVideoCall();
    });

    return () => {
      socket.off("hang-up");
    };
  }, [socket, closeVideoCall]);

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

  function hangUpCall() {
    closeVideoCall();
    socket?.emit("hang-up");
  }

  return (
    <div className="flex gap-4">
      <video className="rounded-lg" ref={localVideoRef} autoPlay muted></video>
      <video className="rounded-lg" ref={remoteVideoRef} autoPlay></video>
      <Button ref={hangupButtonRef} onClick={hangUpCall} disabled>
        Hang Up
      </Button>
    </div>
  );
};

export default Meet;
