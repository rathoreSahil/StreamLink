import { type ClassValue, clsx } from "clsx";
import toast from "react-hot-toast";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getClosestStun = async (): Promise<string | number> => {
  const GEO_LOC_URL = process.env.NEXT_PUBLIC_GEO_LOC_URL!;
  const IPV4_URL = process.env.NEXT_PUBLIC_IPV4_URL!;
  const GEO_USER_URL = process.env.NEXT_PUBLIC_GEO_USER_URL!;
  try {
    const geoLocs = await (await fetch(GEO_LOC_URL)).json();
    const { latitude, longitude } = await (await fetch(GEO_USER_URL)).json();
    const closestAddress = (await (await fetch(IPV4_URL)).text())
      .trim()
      .split("\n")
      .map((addr) => {
        const [stunLat, stunLon] = geoLocs[addr.split(":")[0]];
        const dist =
          ((latitude - stunLat) ** 2 + (longitude - stunLon) ** 2) ** 0.5;
        return [addr, dist];
      })
      .reduce(([addrA, distA], [addrB, distB]) =>
        distA <= distB ? [addrA, distA] : [addrB, distB]
      )[0];
    return closestAddress;
  } catch (error: any) {
    throw new Error("Couldn't fetch STUN server", error);
  }
};

const getUserMedia = async (): Promise<MediaStream> => {
  const mediaConstraints = {
    audio: true, // We want an audio track
    video: true, // And we want a video track
  };

  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia(
      mediaConstraints
    );
    return mediaStream;
  } catch (error: any) {
    throw new Error("Couldn't get User Media", error);
  }
};

const createPeerConnection = async () => {
  try {
    const stun = await getClosestStun();
    const myPeerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: `stun:${stun}`,
        },
      ],
    });

    // myPeerConnection.onicecandidate = handleICECandidateEvent;
    // myPeerConnection.ontrack = handleTrackEvent;
    // myPeerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
    // myPeerConnection.onremovetrack = handleRemoveTrackEvent;
    // myPeerConnection.oniceconnectionstatechange =
    //   handleICEConnectionStateChangeEvent;
    // myPeerConnection.onicegatheringstatechange =
    //   handleICEGatheringStateChangeEvent;
    // myPeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
  } catch (error: any) {
    console.error(error);
    toast.error(error.message);
  }
};

export { getUserMedia, createPeerConnection };
