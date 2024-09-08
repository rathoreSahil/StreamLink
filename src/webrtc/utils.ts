const getClosestStun = async (): Promise<string | number> => {
  const GEO_LOC_URL = process.env.NEXT_PUBLIC_GEO_LOC_URL!;
  const IPV4_URL = process.env.NEXT_PUBLIC_IPV4_URL!;
  const GEO_USER_URL = process.env.NEXT_PUBLIC_GEO_USER_URL!;

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
};

const getUserMedia = async (): Promise<MediaStream> => {
  const mediaConstraints = {
    audio: true,
    video: true,
  };

  const mediaStream = await navigator.mediaDevices.getUserMedia(
    mediaConstraints
  );
  return mediaStream;
};

const createPeerConnection = async (): Promise<RTCPeerConnection> => {
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

  return myPeerConnection;
};

// let makingOffer = false;
// const handleNegotiationNeededEvent = async () => {
//   try {
//     makingOffer = true;
//     await pc.setLocalDescription();
//     signaler.send({ description: pc.localDescription });
//   } catch (err) {
//     console.error(err);
//   } finally {
//     makingOffer = false;
//   }
// };

export { getUserMedia, createPeerConnection };
