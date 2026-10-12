import { Resource } from "@angular/core";
import { ResourceUtils } from "./resource.utils";

describe("ResourceUtils.isPending", () => {
    function resource(status: string): Resource<unknown> {
        return { status: () => status } as Resource<unknown>;
    }

    it("treats idle and loading as pending first paint", () => {
        expect(ResourceUtils.isPending(resource("idle"))).toBeTrue();
        expect(ResourceUtils.isPending(resource("loading"))).toBeTrue();
    });

    it("does not treat reloading or resolved as pending", () => {
        expect(ResourceUtils.isPending(resource("reloading"))).toBeFalse();
        expect(ResourceUtils.isPending(resource("resolved"))).toBeFalse();
        expect(ResourceUtils.isPending(resource("error"))).toBeFalse();
    });
});
