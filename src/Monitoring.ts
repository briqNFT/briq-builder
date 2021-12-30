import * as Sentry from "@sentry/vue";
import { Integrations } from "@sentry/tracing";

import { APP_ENV, DEV } from './Meta';

export function setupMonitoring(app: any, router: any)
{
    // temporarily turned off except in dev env to avoid flooding.
    if (!DEV)
        return;
    // Init Sentry error tracking.
    Sentry.init({
        app,
        dsn: "https://906eb15ca7ee4507b4e8c19d36dad8df@o1101631.ingest.sentry.io/6127679",
        environment: APP_ENV,
        integrations: [
            new Integrations.BrowserTracing({
                routingInstrumentation: Sentry.vueRouterInstrumentation(router),
                tracingOrigins: ["localhost", "briq.construction","sltech.company", /^\//],
            }),
        ],
        // Still report vue errors in the console.
        logErrors: true,
        // Sample 5% of transactions for performance.
        tracesSampleRate: 0.05,
    });
}

/**
 * Manual exception reporting
 * @param err Error to track
 */
export function reportError(err: Error)
{
    Sentry.captureException(err);
}