import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import { useGymDirectoryStore } from "@/stores/gym-directory-store";
import { GymSettingsTeamCard } from "./gym-settings-team-card";

function GymSettingsTeamCardStory() {
  useEffect(() => {
    useGymDirectoryStore.setState({
      teamPersonals: [
        {
          id: "team-1",
          personal: {
            id: "personal-1",
            name: "Rafa Moreira",
            email: "rafa@gymrats.local",
            avatar: "/placeholder.svg",
          },
        },
      ],
      teamSearchResults: [
        {
          id: "personal-2",
          name: "Julia Lima",
          email: "julia@gymrats.local",
          alreadyLinked: false,
        },
      ],
      personalProfilesById: {
        "personal-1": {
          id: "personal-1",
          name: "Rafa Moreira",
          avatar: "/placeholder.svg",
          bio: "Especialista em hipertrofia e acompanhamento de longo prazo.",
          atendimentoPresencial: true,
          atendimentoRemoto: true,
          email: "rafa@gymrats.local",
          cref: "123456-G/SP",
          gyms: [
            {
              id: "gym-1",
              name: "GymRats Paulista",
            },
          ],
          studentsCount: 18,
        },
      },
      isLoadingTeam: false,
      isSearchingTeam: false,
      loadingPersonalProfileIds: {},
      teamError: "",
      loadTeamPersonals: async () => undefined,
      searchTeamPersonals: async () => undefined,
      loadPersonalProfile: async () => undefined,
      linkTeamPersonal: async () => undefined,
      unlinkTeamPersonal: async () => undefined,
    });
  }, []);

  return <GymSettingsTeamCard />;
}

const meta = {
  title: "Organisms/Gym/GymSettingsTeamCard",
  component: GymSettingsTeamCardStory,
} satisfies Meta<typeof GymSettingsTeamCardStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
