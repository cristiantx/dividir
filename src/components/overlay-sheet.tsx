import type { ReactNode } from "react";

import { OverlayShell } from "./overlay-shell";

type OverlaySheetProps = {
  children: ReactNode;
  description: string;
  footer?: ReactNode;
  isVisible: boolean;
  onClose: () => void;
  title: string;
};

export function OverlaySheet({
  children,
  description,
  footer,
  isVisible,
  onClose,
  title,
}: OverlaySheetProps) {
  return (
    <OverlayShell
      description={description}
      footer={footer}
      isVisible={isVisible}
      onClose={onClose}
      title={title}
      variant="sheet"
    >
      {children}
    </OverlayShell>
  );
}
