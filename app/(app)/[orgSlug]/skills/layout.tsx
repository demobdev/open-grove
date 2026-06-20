import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skills Registry | OpenGrove",
  description: "Define prompts, quality gates, and automated workflows.",
};

export default function SkillsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
