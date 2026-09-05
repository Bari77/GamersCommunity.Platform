import { Component, inject } from "@angular/core";
import { NbAuthModule } from "@nebular/auth";
import { NbAlertModule, NbButtonModule, NbCardModule, NbIconModule, NbLayoutModule } from "@nebular/theme";
import { UsersStore } from "../../stores/users.store";

@Component({
    standalone: true,
    selector: "app-login",
    imports: [NbLayoutModule, NbCardModule, NbButtonModule, NbIconModule, NbAlertModule, NbAuthModule],
    templateUrl: "./login.component.html",
    styleUrls: ["./login.component.scss"],
})
export class LoginComponent {
    public readonly usersStore = inject(UsersStore);

    public login(): void {
        this.usersStore.login();
    }

    public signup(): void {
        this.usersStore.signup();
    }

    public signupWithGoogle(): void {
        this.usersStore.signupWithGoogle();
    }
}
