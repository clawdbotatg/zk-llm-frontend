import { NextResponse } from "next/server";

const API_CREDITS_ADDRESS = "0x4A6782D251e12c06e1f16450D8b28f6C857cFdd1";
const CHAIN_ID = 8453;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.zkllmapi.com";

export async function GET() {
  return NextResponse.json({
    address: API_CREDITS_ADDRESS,
    chainId: CHAIN_ID,
    apiUrl: API_URL,
  });
}
