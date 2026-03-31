import type { PersonalGymsScreenProps } from "./personal-gyms.screen";

interface PersonalGymsFixtureOverrides
  extends Partial<PersonalGymsScreenProps> {}

export function createPersonalGymsFixture(
  overrides: PersonalGymsFixtureOverrides = {},
): PersonalGymsScreenProps {
  return {
    affiliations: [
      {
        id: "affiliation-1",
        gym: {
          id: "gym-1",
          name: "GymRats Paulista",
          logo: "/placeholder.svg",
        },
      },
      {
        id: "affiliation-2",
        gym: {
          id: "gym-2",
          name: "Arena Norte",
          image: "/placeholder.svg",
        },
      },
    ],
    gymHandleInput: "",
    isLinking: false,
    unlinkingId: null,
    onGymHandleInputChange: () => {},
    onLink: () => {},
    onUnlink: () => {},
    onViewGym: () => {},
    ...overrides,
  };
}
