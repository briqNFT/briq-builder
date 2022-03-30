import type * as SentryType from '@sentry/vue';
var Sentry: typeof SentryType;

import { APP_ENV, DEV, VERSION } from './Meta';

export async function setupMonitoring(app: any, router: any)
{
    //if (APP_ENV === "dev")
    //    return;
    
    let sentryLib = await import('./sentry_wrapper');
    Sentry = sentryLib.Sentry;
    const Integrations = sentryLib.Integrations;

    // Init Sentry error tracking.
    Sentry.init({
        app,
        dsn: "https://906eb15ca7ee4507b4e8c19d36dad8df@o1101631.ingest.sentry.io/6127679",
        release: `briq-api-${VERSION}`,
        environment: APP_ENV,
        integrations: [
            new Integrations.BrowserTracing({
                routingInstrumentation: Sentry.vueRouterInstrumentation(router),
                tracingOrigins: ["localhost", "realms.briq.construction", "briq.construction", "sltech.company", /^\//],
            }),
        ],
        beforeSend(event: SentryType.Event) {
            // Specifically filter out most network errors.
            if (event.exception?.values?.[0]?.value === "Network Error" || event.exception?.values?.[0]?.value === "Timeout")
                if (Math.random() > 0.01)
                    return null;
            return event;
        },
        // Still report vue errors in the console.
        logErrors: true,
        // % of transactions to sample for performance.
        tracesSampleRate: 0.0,
        // % of errors to report
        sampleRate: 1.0,
    });
}

export function addBreadCrumb(message: string)
{
    Sentry.addBreadcrumb({
        category: "console",
        message: message,
        level: Sentry.Severity.Info,
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