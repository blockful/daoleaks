
import { createAppKit } from '@reown/appkit/react'

import { WagmiProvider } from 'wagmi'
import { base, baseSepolia, mainnet } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import type { CaipNetworkId } from '@reown/appkit'
// 0. Setup queryClient
const queryClient = new QueryClient()

// 1. Get projectId from https://cloud.reown.com
const projectId = '37cbaafff91120f7e1424b6832caa462'

// 2. Create a metadata object - optional
// const metadata = {
//   name: 'daoleaks',
//   description: 'AppKit Example',
//   url: 'https://reown.com/appkit', // origin must match your domain & subdomain
//   icons: ['https://assets.reown.com/reown-profile-pic.png']
// }

// 3. Set the networks
const networks = [mainnet, base, baseSepolia]

type CustomRpcUrlMap = Record<CaipNetworkId, {url: string}[]>

const customRpcUrls: CustomRpcUrlMap = {
  'eip155:1': [{ url: 'https://eth-mainnet.g.alchemy.com/v2/864ae0IHj8rlKM2OHei4_1CzTV3xUdB5' }],
  'eip155:8453': [{ url: 'https://base-mainnet.g.alchemy.com/v2/864ae0IHj8rlKM2OHei4_1CzTV3xUdB5' }],
  'eip155:84532': [{ url: 'https://base-sepolia.g.alchemy.com/v2/864ae0IHj8rlKM2OHei4_1CzTV3xUdB5' }]
}

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
  customRpcUrls,
});

console.log('wagmiAdapter', wagmiAdapter.wagmiConfig);




// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, base, baseSepolia],
  projectId,
  features: {
    analytics: false // Optional - defaults to your Cloud configuration
  },
  customRpcUrls,
})

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
