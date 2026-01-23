import { subscriptionsRoutes } from "@back-end/src/server/routes/subscriptions";
import { gymSubscriptionsRoutes } from "@back-end/src/server/routes/gym-subscriptions";
import { paymentsRoutes } from "@back-end/src/server/routes/payments";
import { paymentMethodsRoutes } from "@back-end/src/server/routes/payment-methods";
import { membershipsRoutes } from "@back-end/src/server/routes/memberships";

export const billingRoutes = {
  subscriptions: subscriptionsRoutes,
  gymSubscriptions: gymSubscriptionsRoutes,
  payments: paymentsRoutes,
};

export { paymentMethodsRoutes, membershipsRoutes };
