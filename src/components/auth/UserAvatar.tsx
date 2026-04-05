"use client";

import { User } from "lucide-react";

export function UserAvatar({ image }: { image?: string | null }) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt="User avatar" className="w-full h-full object-cover" />
    );
  }

  return <User className="w-5 h-5 text-text-secondary" />;
}