import { PromiseUtils } from "./promise.utils";

describe("PromiseUtils.waitUntilFalse", () => {
    it("resolves when the getter becomes false", async () => {
        let loading = true;
        setTimeout(() => {
            loading = false;
        }, 30);

        await expectAsync(PromiseUtils.waitUntilFalse(() => loading, 10)).toBeResolved();
    });

    it("rejects when the timeout elapses while still true", async () => {
        await expectAsync(PromiseUtils.waitUntilFalse(() => true, 10, 40)).toBeRejectedWithError(
            "waitUntilFalse timeout",
        );
    });
});
