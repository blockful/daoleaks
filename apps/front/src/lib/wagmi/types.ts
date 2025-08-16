import { wagmiAdapter } from "./web3-provider";

import 'wagmi';

declare module 'wagmi' {
    interface Register {
      config: typeof wagmiAdapter.wagmiConfig
    }
  }