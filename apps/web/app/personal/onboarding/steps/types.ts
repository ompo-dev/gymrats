export interface PersonalOnboardingData {
  name: string;
  phone: string;
  bio: string;
  atendimentoPresencial: boolean;
  atendimentoRemoto: boolean;
}

export interface PersonalStepProps {
  formData: PersonalOnboardingData;
  setFormData: React.Dispatch<React.SetStateAction<PersonalOnboardingData>>;
}
