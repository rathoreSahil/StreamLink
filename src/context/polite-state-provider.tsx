"use client";
import { createContext, useContext, useState } from "react";

type PoliteStateContextType = {
  polite: boolean;
  setPolite: React.Dispatch<React.SetStateAction<boolean>>;
};

const PoliteStateContext = createContext<PoliteStateContextType>({
  polite: false,
  setPolite: () => {},
});

const PoliteStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [polite, setPolite] = useState<boolean>(false);
  return (
    <PoliteStateContext.Provider value={{ polite, setPolite }}>
      {children}
    </PoliteStateContext.Provider>
  );
};

const usePoliteState = () => {
  return useContext(PoliteStateContext);
};

export { PoliteStateProvider, usePoliteState };
