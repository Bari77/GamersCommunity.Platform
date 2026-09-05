/**
 * Utilitaires pour les promesses (attente conditionnelle, etc.).
 */
export class PromiseUtils {
    /**
     * Attend que le getter retourne false (polling).
     * Utile pour attendre la fin d'un chargement (ex. resource.isLoading() === false).
     */
    public static waitUntilFalse(
        getter: () => boolean,
        intervalMs: number = 50,
        timeoutMs?: number,
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const start = Date.now();

            const check = (): void => {
                if (!getter()) {
                    resolve();
                    return;
                }
                if (timeoutMs != null && Date.now() - start >= timeoutMs) {
                    reject(new Error("waitUntilFalse timeout"));
                    return;
                }
                setTimeout(check, intervalMs);
            };

            check();
        });
    }
}
