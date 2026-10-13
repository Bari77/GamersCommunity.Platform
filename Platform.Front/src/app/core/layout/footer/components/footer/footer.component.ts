import { Component, computed } from "@angular/core";

@Component({
    standalone: true,
    selector: "app-footer",
    imports: [],
    templateUrl: "./footer.component.html",
    styleUrl: "./footer.component.scss",
})
export class FooterComponent {
    public readonly year = computed(() => new Date().getFullYear());
}
