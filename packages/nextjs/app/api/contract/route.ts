import { NextResponse } from "next/server";
import externalContracts from "~~/contracts/externalContracts";

export async function GET() {
  const address = externalContracts[8453].APICredits.address;
  return NextResponse.json({
    address,
    chainId: 8453,
    apiUrl: "https://backend.zkllmapi.com",
  });
}
