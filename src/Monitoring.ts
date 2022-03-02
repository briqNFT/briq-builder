import type * as SentryType from '@sentry/vue';
var Sentry: typeof SentryType;

import { APP_ENV, DEV } from './Meta';

export async function setupMonitoring(app: any, router: any)
{
    if (APP_ENV === "dev")
        return;
    
    let sentryLib = await import('./sentry_wrapper');
    Sentry = sentryLib.Sentry;
    const Integrations = sentryLib.Integrations;

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
        beforeSend(event: SentryType.Event) {
            if ((event.message?.indexOf("Timeout") ?? -1) !== -1 || (event.message?.indexOf("Network Error") ?? -1) !== -1)
                return null;
            return event;
        },
        // Still report vue errors in the console.
        logErrors: true,
        // % of transactions to sample for performance.
        tracesSampleRate: 0.0,
        // % of errors to report
        sampleRate: 0.1,
    });
}

/**
 * Manual exception reporting. Adds more info to the stack trace for easier tracking.
 * @param err Error to track. Can be 'string' because of an ArgentX bug.
 * @param reason A richer reason for the error for easier reading in Sentry.
 */
export function reportError(err: Error | string, reason?: string)
{
    let richError = new Error();
    richError.name = (err instanceof Error) ? err?.name || "Unknown error" : err;
    richError.message = (reason ? `(${reason})\n` : "") + err?.message;
    richError.stack += err?.stack ? "\n" + err?.stack : "";
    if (DEV)
        console.log("reporting error >> ", richError)
    Sentry?.captureException(richError);
}