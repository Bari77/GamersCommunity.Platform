import { Component, input } from "@angular/core";

@Component({
    standalone: true,
    selector: "app-skeleton",
    templateUrl: "./skeleton.component.html",
    styleUrl: "./skeleton.component.scss",
    host: {
        "[class.skeleton--circle]": 'shape() === "circle"',
        "[style.width]": "width()",
        "[style.height]": "height()",
        "[style.border-radius]": 'shape() === "circle" ? "50%" : radius()',
        "[attr.aria-hidden]": "true",
    },
})
export class SkeletonComponent {
    public readonly width = input("100%");
    public readonly height = input("1rem");
    public readonly radius = input("0.25rem");
    public readonly shape = input<"rect" | "circle">("rect");
}
