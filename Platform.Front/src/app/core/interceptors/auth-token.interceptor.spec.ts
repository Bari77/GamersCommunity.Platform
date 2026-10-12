import { HttpClient, provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { AuthTokenService } from "@core/services/auth-token.service";
import { environment } from "environments/environment";
import { of } from "rxjs";
import { authTokenInterceptor } from "./auth-token.interceptor";

describe("authTokenInterceptor", () => {
    let http: HttpClient;
    let httpMock: HttpTestingController;
    let bearerToken: jasmine.Spy;

    beforeEach(() => {
        bearerToken = jasmine.createSpy("bearerToken").and.returnValue(of("access-token"));
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([authTokenInterceptor])),
                provideHttpClientTesting(),
                { provide: AuthTokenService, useValue: { bearerToken } },
            ],
        });
        http = TestBed.inject(HttpClient);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it("attaches the bearer token to API calls", () => {
        http.get(`${environment.apiUrl}/users/me`).subscribe();
        const req = httpMock.expectOne(`${environment.apiUrl}/users/me`);
        expect(req.request.headers.get("Authorization")).toBe("Bearer access-token");
        req.flush({});
    });

    it("leaves IdP calls untouched", () => {
        http.get(`${environment.idpUrl}/oauth/token`).subscribe();
        const req = httpMock.expectOne(`${environment.idpUrl}/oauth/token`);
        expect(req.request.headers.has("Authorization")).toBeFalse();
        expect(bearerToken).not.toHaveBeenCalled();
        req.flush({});
    });

    it("forwards anonymous API calls when there is no session", () => {
        bearerToken.and.returnValue(of(null));
        http.get(`${environment.apiUrl}/games`).subscribe();
        const req = httpMock.expectOne(`${environment.apiUrl}/games`);
        expect(req.request.headers.has("Authorization")).toBeFalse();
        req.flush([]);
    });
});
