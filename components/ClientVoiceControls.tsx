'use client';

import dynamic from "next/dynamic";
import { IBook } from "@/types";

const VoiceControls = dynamic(() => import("@/components/VoiceControls"), {
  ssr: false,
});

export default function ClientVoiceControls({ book }: { book: IBook }) {
  return <VoiceControls book={book} />;
}
