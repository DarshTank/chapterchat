export function useSubscription() {
    return {
        plan: "free",
        limits: {
            maxBooks: 999,
            maxSessionsPerMonth: 999,
            maxDurationPerSession: 60,
        },
    };
}
