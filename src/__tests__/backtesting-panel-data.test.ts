import {
  getBacktestPriceData,
  HISTORICAL_DATA_UNAVAILABLE_MESSAGE,
} from "@/components/BacktestingPanel";

describe("getBacktestPriceData", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects stale sample-data usage without fetching", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(getBacktestPriceData("BTCUSD", 30)).rejects.toThrow(
      HISTORICAL_DATA_UNAVAILABLE_MESSAGE,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
