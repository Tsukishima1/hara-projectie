import { AlertTriangle } from "lucide-react";

interface PageErrorProps {
  message: string;
}

export const PageError = ({
  message = "Something went wrong!"
}: PageErrorProps) => {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <AlertTriangle className="size-8 text-muted-foreground mb-2"/>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
};
