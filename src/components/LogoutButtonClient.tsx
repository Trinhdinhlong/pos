"use client";
import dynamic from "next/dynamic";

const LogoutButton = dynamic(() => import("@/components/LogoutButton"), { ssr: false });

export default function LogoutButtonClient() {
  return <LogoutButton />;
}
