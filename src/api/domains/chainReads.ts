import type { Transport } from "../transport.js";
import type { CreatorCoinGuarantees } from "../../starknet/services/creatorCoin.js";
import type { PopClaimInfo } from "../../starknet/pop-claim.js";
import type { DropOnchain } from "../../starknet/drop-state.js";
import { dropStateFromWire, type DropStateWire } from "../../contract/chainReads.js";
import type { ApiIpNftTokenData, ApiTierOnchain } from "../../types/api.js";

export interface ChainReadsApi {
  ticket(contract: string, tokenId: string): Promise<ApiTierOnchain>;
  ticketCount(contract: string): Promise<number>;
  clubMembershipCount(contract: string): Promise<number>;
  clubMembership(contract: string, tokenId: string): Promise<ApiTierOnchain>;
  isClubMember(contract: string, tokenId: string, wallet: string): Promise<boolean>;
  ipNftTokenData(contract: string, tokenId: string): Promise<ApiIpNftTokenData | null>;
  coinGuarantees(contract: string): Promise<CreatorCoinGuarantees | null>;
  popClaimInfo(collection: string): Promise<PopClaimInfo | null>;
  dropState(contract: string): Promise<DropOnchain | null>;
}

export function createChainReadsApi(t: Transport): ChainReadsApi {
  const data = async <T>(path: string): Promise<T> => (await t.get<{ data: T }>(path)).data;
  return {
    ticket: (contract, tokenId) => data(`/v1/tickets/${t.addr(contract)}/${tokenId}`),
    ticketCount: async (contract) => (await data<{ count: number }>(`/v1/tickets/${t.addr(contract)}/count`)).count,
    clubMembershipCount: async (contract) => (await data<{ count: number }>(`/v1/club/${t.addr(contract)}/count`)).count,
    clubMembership: (contract, tokenId) => data(`/v1/club/${t.addr(contract)}/${tokenId}`),
    isClubMember: async (contract, tokenId, wallet) =>
      (await data<{ isMember: boolean }>(`/v1/club/${t.addr(contract)}/${tokenId}/member/${t.addr(wallet)}`)).isMember,
    ipNftTokenData: (contract, tokenId) => data(`/v1/ipnft/${t.addr(contract)}/${tokenId}`),
    coinGuarantees: (contract) => data(`/v1/coins/${t.addr(contract)}/guarantees`),
    popClaimInfo: (collection) => data(`/v1/pop/${t.addr(collection)}/claim-info`),
    async dropState(contract) {
      const wire = await data<DropStateWire | null>(`/v1/drops/${t.addr(contract)}/state`);
      return wire ? dropStateFromWire(wire) : null;
    },
  };
}
