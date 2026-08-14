import type { Chain } from "./chains.js";

export const SUPPORTED_URL_CHAINS = ["STARKNET"] as const satisfies readonly Chain[];

export function chainSlug(chain: Chain): string {
  return chain.toLowerCase();
}

export function chainFromSlug(slug: string): Chain | null {
  const upper = slug.toUpperCase() as Chain;
  return (SUPPORTED_URL_CHAINS as readonly Chain[]).includes(upper) ? upper : null;
}

type Idish = string | number | null | undefined;
const seg = (v: Idish): string => (v == null ? "" : String(v));

export function assetHref(chain: Chain, contract: Idish, tokenId: Idish): string {
  return `/asset/${chainSlug(chain)}/${seg(contract)}/${seg(tokenId)}`;
}

export function collectionHref(chain: Chain, contract: Idish): string {
  return `/collections/${chainSlug(chain)}/${seg(contract)}`;
}

export function coinHref(chain: Chain, address: Idish): string {
  return `/coins/${chainSlug(chain)}/${seg(address)}`;
}
