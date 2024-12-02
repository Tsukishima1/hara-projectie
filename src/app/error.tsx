"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const ErrorPage = () => {
  return (
    <div className="h-screen flex flex-col gap-y-4 items-center justify-center">
      <AlertTriangle className="size-8 text-muted-foreground"/>
      <p className="text-muted-foreground">Something went wrong!</p>
      <Button variant="secondary">
        <Link href="/">Back to Home</Link>
      </Button>
    </div>
  );
};

export default ErrorPage;
