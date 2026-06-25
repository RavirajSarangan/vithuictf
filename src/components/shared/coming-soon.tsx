import { Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/shared/button-link";

interface ComingSoonProps {
  portalName: string;
  description?: string;
  helperText?: string;
}

export function ComingSoon({ portalName, description, helperText }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center px-4 py-16 sm:py-24">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-icvf-accent/15">
            <Clock className="size-8 text-icvf-accent" />
          </div>
          <CardTitle className="text-2xl">{portalName}</CardTitle>
          <CardDescription>
            {description ?? "This portal is under development and will be available soon."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {helperText ??
              "Student and teacher portals are live. This feature will open in a future release."}
          </p>
          <ButtonLink href="/login" variant="icvf" className="w-full">
            Login
          </ButtonLink>
          <ButtonLink href="/" variant="outline" className="w-full">
            Back to Home
          </ButtonLink>
        </CardContent>
      </Card>
    </div>
  );
}
