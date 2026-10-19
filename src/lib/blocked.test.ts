import { describe, expect, it } from "vitest";
import { isBlocked } from "@/lib/blocked";

describe("controlled-product safety filter", () => {
  it.each(["testosterone", "nandrolone", "trenbolone", "stanozolol", "boldenone", "oxymetholone", "cut mix", "somatropin", "kigtropin", "HGH", "zopiclone", "modafinil", "armodafinil", "tramadol", "drop shipping", "online pharmacy"])("blocks %s", (name) => expect(isBlocked(name)).toBe(true));
  it.each(["amoxicillin", "metformin", "tenofovir", "imatinib", "paclitaxel"])("allows normal medicine %s", (name) => expect(isBlocked(name)).toBe(false));
});
