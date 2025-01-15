import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from "@rpsls/server/src/router";

export const trpc = createTRPCReact<AppRouter>();