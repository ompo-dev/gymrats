import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  createStudentPaymentsFixture,
  StudentPaymentsScreen,
} from "@/components/screens/student";

const meta = {
  title: "Screens/Student/StudentPayments",
  component: StudentPaymentsScreen,
  args: createStudentPaymentsFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof StudentPaymentsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Memberships: Story = {};

export const Payments: Story = {
  args: createStudentPaymentsFixture({
    activeTab: "payments",
    expandedGymIdMemberships: null,
    expandedGymIdPayments: "gym-1",
  }),
};

export const Subscription: Story = {
  args: createStudentPaymentsFixture({
    activeTab: "subscription",
    expandedGymIdMemberships: null,
  }),
};
