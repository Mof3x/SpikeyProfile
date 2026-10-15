import { parseOpenMeteo, roundCoordinate } from "@/core/sources/weatherMetrics";
import forecastFixture from "./fixtures/open-meteo-forecast.json";
import airFixture from "./fixtures/open-meteo-air.json";

describe("Open-Meteo parsing", () => {
  const days = parseOpenMeteo(forecastFixture as any, airFixture as any);

  test("reads daily values and converts seconds to hours", () => {
    expect(days["2026-10-13"].tempMax).toBe(16.2);
    expect(days["2026-10-13"].sunshine).toBe(5);
    expect(days["2026-10-13"].daylight).toBe(11);
  });

  test("averages hourly humidity and pressure per day", () => {
    expect(days["2026-10-13"].humidity).toBe(80);
    expect(days["2026-10-13"].pressure).toBe(1015);
    expect(days["2026-10-14"].pressure).toBe(1008);
  });

  test("derives pressure change, big drops, swing and flags", () => {
    expect(days["2026-10-14"].pressureChange).toBe(-7);
    expect(days["2026-10-14"].pressureDrop).toBe(1);
    expect(days["2026-10-13"].pressureDrop).toBeUndefined();
    expect(days["2026-10-13"].tempSwing).toBe(8.1);
    expect(days["2026-10-14"].muggy).toBe(1);
  });

  test("takes air quality means and pollen peaks", () => {
    expect(days["2026-10-13"].aqi).toBe(30);
    expect(days["2026-10-13"].grassPollen).toBe(12);
  });

  test("rounds coordinates to about 10 km", () => {
    expect(roundCoordinate(51.50735)).toBe(51.5);
    expect(roundCoordinate(-0.12776)).toBe(-0.1);
  });
});
