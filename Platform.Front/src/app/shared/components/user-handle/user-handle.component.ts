import { booleanAttribute, Component, computed, input } from "@angular/core";

@Component({
    standalone: true,
    selector: "app-user-handle",
    templateUrl: "./user-handle.component.html",
    styleUrl: "./user-handle.component.scss",
})
export class UserHandleComponent {
    public readonly nickname = input.required<string>();
    public readonly discriminator = input<string>("");
    public readonly stacked = input(false, { transform: booleanAttribute });

    public readonly normalizedDiscriminator = computed(() => (this.discriminator() ?? "").replace(/^#/, "").trim());
}
