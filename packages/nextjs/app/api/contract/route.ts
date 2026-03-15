import { NextResponse } from "next/server";
import deployedContracts from "../../../contracts/deployedContracts";

export async function GET() {
  const address = deployedContracts[8453].APICredits.address;
  return NextResponse.json({
    address,
    chainId: 8453,
    apiUrl: "https://backend.zkllmapi.com",
  });
}
