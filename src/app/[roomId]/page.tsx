import { useEffect } from "react";

type MeetParams = {
  params: { roomId: string };
};

const Meet = ({ params }: MeetParams) => {
  const { roomId } = params;
  useEffect(() => {}, []);

  return <div>Meet {roomId}</div>;
};

export default Meet;
