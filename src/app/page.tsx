"use client";
import CreateMeet from "@/components/shared/create-meet";
import JoinMeet from "@/components/shared/join-meet";
import Image from "next/image";
import heroImg from "@/../public/hero-section-image.jpg";

const Home = () => {
  return (
    <div className="flex h-lvh px-20">
      <div className="flex flex-1 items-center justify-center">
        <Image
          src={heroImg}
          alt="heroImg"
          className="rounded-full aspect-square object-cover object-[20%_50%] w-3/4"
        />
      </div>
      <div className="flex flex-1 flex-col justify-center items-center text-center gap-12">
        <div className="space-y-2">
          <h1 className="text-7xl font-normal">Streamlink</h1>
          <h3 className="text-3xl opacity-70 font-light">
            Experience seamless video communication with anyone, anywhere
          </h3>
        </div>
        <div className="flex gap-8">
          <CreateMeet />
          <JoinMeet />
        </div>
      </div>
    </div>
  );
};

export default Home;
