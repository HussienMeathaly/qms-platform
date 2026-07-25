import type { ReactNode } from "react";

interface PagePlaceholderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function PagePlaceholder({ title, description, icon }: PagePlaceholderProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        {icon ? (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            {icon}
          </div>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {description ?? "Coming Soon..."}
        </p>
      </div>
    </div>
  );
}