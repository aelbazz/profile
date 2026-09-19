import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth';

@Component({
  selector: 'app-platform-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './platform-admin-login.component.html',
  styleUrl: './platform-admin-login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlatformAdminLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly sessionExpired = signal(this.route.snapshot.queryParamMap.get('reason') === 'expired');

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.sessionExpired.set(false);

    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => {
        // This login endpoint is shared by every role - a valid CLIENT/COORDINATOR
        // account can authenticate here just as successfully as an ADMIN one. Only an
        // ADMIN belongs in this portal, so anything else is signed back out immediately
        // rather than left holding a token that will 403 on every screen it tries to open.
        if (this.auth.user()?.role !== 'ADMIN') {
          this.auth.logout();
          this.submitting.set(false);
          this.errorMessage.set('This account is not a platform administrator.');
          return;
        }

        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        const target = redirect?.startsWith('/') ? redirect : '/admin';
        void this.router.navigateByUrl(target);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(this.describe(error));
      }
    });
  }

  private describe(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Cannot reach the API. Is the backend running?';
    }
    if (error.status === 401) {
      return 'Invalid email or password.';
    }
    if (error.status === 429) {
      return 'Too many attempts. Wait a minute before trying again.';
    }
    return 'Something went wrong signing in. Please try again.';
  }
}
