"use client";
import CreateMeet from "@/components/shared/create-meet";
import JoinMeet from "@/components/shared/join-meet";

const Home = () => {
  return (
    <>
      <h1 className="text-7xl font-normal">Conversations That Matter</h1>
      <h3 className="text-3xl opacity-90 font-light">
        Experience seamless video communication with anyone, anywhere
      </h3>
      <div>
        <CreateMeet />
        <JoinMeet />
      </div>
    </>
  );
};

export default Home;
