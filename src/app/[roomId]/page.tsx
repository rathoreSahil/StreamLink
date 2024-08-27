type MeetParams = {
  params: { roomId: string };
};

const Meet = ({ params }: MeetParams) => {
  const { roomId } = params;
  return <div>Meet {roomId}</div>;
};

export default Meet;
