import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PixQrModal } from "./pix-qr-modal";

const meta = {
  title: "Organisms/Modals/PixQrModal",
  component: PixQrModal,
  args: {
    isOpen: true,
    onClose: () => undefined,
    brCode: "00020101021226850014br.gov.bcb.pix2563pix.example.com/pay/12345678901234567890520400005303986540649.905802BR5913GYMRATS LTDA6009SAO PAULO62070503***6304ABCD",
    brCodeBase64: "",
    amount: 4990,
    title: "Pagamento PIX",
  },
} satisfies Meta<typeof PixQrModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
