"use client";

import { StudentEducationScreen } from "@/components/screens/student";

export interface EducationPageProps {
  onSelectView: (view: "muscles" | "lessons") => void;
}

function EducationPageSimple({ onSelectView }: EducationPageProps) {
  return <StudentEducationScreen onSelectView={onSelectView} />;
}

export const EducationPage = {
  Simple: EducationPageSimple,
};
