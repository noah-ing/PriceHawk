"use client";

import RegisterInner from "./register-inner";

// This is a simple adapter component that's used by the page
// It allows us to keep the RegisterInner implementation as is
export default function RegisterClient({ callbackUrl }: { callbackUrl: string }) {
  return <RegisterInner />;
}
