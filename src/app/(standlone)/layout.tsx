import Link from "next/link";
import Image from "next/image";
import React from "react";

import { UserButton } from "@/features/auth/components/user-button";

interface StandloneLayoutProps {
  children: React.ReactNode;
}

const StandloneLayout = ({ children }: StandloneLayoutProps) => {
  return (
    <main className="bg-neutral-100 min-h-screen">
      <div className="mx-auto max-w-screen-2xl p-4">
        <nav className="flex justify-between items-center h-[73px] xl:px-12">
          <Link href="/">
            <Image src="/logo.svg" alt="logo" height={56} width={152}/>
          </Link>
          <UserButton />
        </nav>
        <div className="flex flex-col items-center justify-center py-4 mt-12">
          {children}
        </div>
      </div>
    </main>
  );
};

export default StandloneLayout;
