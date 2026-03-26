import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PersonalMapContainerComponent } from "./map-container";

const personals = [
  {
    id: "personal-1",
    name: "Rafa Moreira",
    address: "Rua dos Atletas, 45",
    distance: 2.1,
    coordinates: { lat: -23.5624, lng: -46.6541 },
    activeCampaigns: [{ primaryColor: "#50D5A1" }],
  },
] as never;

const meta = {
  title: "Organisms/Sections/PersonalMapWithLeaflet/MapContainer",
  component: PersonalMapContainerComponent,
  args: {
    center: [-23.5614, -46.6559],
    zoom: 13,
    userPosition: { lat: -23.5609, lng: -46.6564 },
    personals,
    selectedPersonalId: "personal-1",
    onPersonalClick: () => undefined,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PersonalMapContainerComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
