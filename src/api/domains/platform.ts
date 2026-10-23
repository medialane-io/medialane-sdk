import type { Transport } from "../transport.js";
import type { ApiPlatformStats, ApiSubmitReport, ApiSwapQuote, ApiSwapQuoteRequest } from "../../types/api.js";

export interface PlatformApi {
  stats(): Promise<ApiPlatformStats>;
  swapQuote(body: ApiSwapQuoteRequest): Promise<ApiSwapQuote>;
  submitReport(report: ApiSubmitReport): Promise<void>;
}

export function createPlatformApi(t: Transport): PlatformApi {
  return {
    async stats() {
      return (await t.get<{ data: ApiPlatformStats }>("/v1/stats")).data;
    },
    async swapQuote(body) {
      return (await t.post<{ quote: ApiSwapQuote }>("/v1/swap/quote", body)).quote;
    },
    async submitReport(report) {
      const targetContract = report.targetContract ? t.addr(report.targetContract) : undefined;
      const targetAddress = report.targetAddress ? t.addr(report.targetAddress) : undefined;
      let targetKey: string | null = null;
      if (report.targetType === "TOKEN" && targetContract && report.targetTokenId) {
        targetKey = `TOKEN:${targetContract}:${report.targetTokenId}`;
      } else if (report.targetType === "COLLECTION" && targetContract) {
        targetKey = `COLLECTION:${targetContract}`;
      } else if (report.targetType === "CREATOR" && targetAddress) {
        targetKey = `CREATOR:${targetAddress}`;
      } else if (report.targetType === "COMMENT" && report.targetId) {
        targetKey = `COMMENT::${report.targetId}`;
      }
      if (!targetKey) throw new Error(`A ${report.targetType} report needs its target`);
      await t.post("/v1/reports", { ...report, targetKey, targetContract, targetAddress });
    },
  };
}
