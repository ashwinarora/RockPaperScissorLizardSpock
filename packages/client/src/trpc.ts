import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from "@kleros-assignment/server/src/router";

export const trpc = createTRPCReact<AppRouter>();