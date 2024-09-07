"use client";

import { handleGetUserMediaError } from "@/webrtc/error";
import { createPeerConnection, getUserMedia } from "@/webrtc/utils";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

type MeetParams = {
  params: { roomId: string };
};

const Meet = ({ params }: MeetParams) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>();

  useEffect(() => {
    createPeerConnection().then((pc) => {
      setPeerConnection(pc);
    });
  }, []);

  useEffect(() => {
    if (!peerConnection) {
      return;
    }
    getUserMedia()
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
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

  return (
    <div className="flex">
      <video className="rounded-lg" ref={videoRef} autoPlay></video>
    </div>
  );
};

export default Meet;
