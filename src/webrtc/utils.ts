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
      if (!geoLocs[addr.split(":")[0]]) return [addr, Infinity];
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
  return myPeerConnection;
};

const getMediaDevicesInfo = () => {
  const audioInputList: MediaDeviceInfo[] = [];
  const audioOutputList: MediaDeviceInfo[] = [];
  const videoInputList: MediaDeviceInfo[] = [];
  navigator.mediaDevices.enumerateDevices().then((devices) => {
    devices.forEach((device) => {
      if (device.kind === "audioinput") {
        audioInputList.push(device);
      } else if (device.kind === "audiooutput") {
        audioOutputList.push(device);
      } else {
        videoInputList.push(device);
      }
    });
  });

  return {
    audioInputList,
    audioOutputList,
    videoInputList,
  };
};

export { getUserMedia, createPeerConnection, getMediaDevicesInfo };
