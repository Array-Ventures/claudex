import { memo, type ReactNode, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Button, FieldMessage, Input, Label } from '@/components/ui';
import { useForgotPasswordMutation } from '@/hooks/queries';
import { isValidEmail } from '@/utils/validation';

interface ForgotPasswordFormData {
  email: string;
}

type ForgotPasswordFormErrors = Partial<Record<keyof ForgotPasswordFormData, string>>;

interface ForgotPasswordPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const ForgotPasswordPageLayout = memo(function ForgotPasswordPageLayout({
  title,
  subtitle,
  children,
}: ForgotPasswordPageLayoutProps) {
  return (
    <Layout isAuthPage={true}>
      <div className="flex h-full flex-col bg-gray-50 dark:bg-black">
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <div className="relative z-10 w-full max-w-sm space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="space-y-2 text-center">
                <h2 className="animate-fadeIn text-3xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/50">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
});

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<ForgotPasswordFormData>({ email: '' });
  const [errors, setErrors] = useState<ForgotPasswordFormErrors | null>(null);

  const forgotPasswordMutation = useForgotPasswordMutation();

  const validators = useMemo(
    () => ({
      email: (value: string): string | undefined => {
        const trimmed = value.trim();
        if (!trimmed) return 'Email is required';
        if (!isValidEmail(trimmed)) return 'Invalid email address';
        return undefined;
      },
    }),
    [],
  );

  const validateForm = useCallback(
    (data: ForgotPasswordFormData): ForgotPasswordFormErrors => {
      const nextErrors: ForgotPasswordFormErrors = {};
      (Object.keys(validators) as Array<keyof ForgotPasswordFormData>).forEach((key) => {
        const validator = validators[key];
        const error = validator(data[key]);
        if (error) {
          nextErrors[key] = error;
        }
      });
      return nextErrors;
    },
    [validators],
  );

  const handleChange = useCallback(
    (name: keyof ForgotPasswordFormData, value: string) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      if (errors?.[name]) {
        setErrors((prev) => {
          if (!prev) return prev;
          const rest = { ...prev };
          delete rest[name];
          return Object.keys(rest).length ? rest : null;
        });
      }

      if (forgotPasswordMutation.isError) {
        forgotPasswordMutation.reset();
      }
    },
    [errors, forgotPasswordMutation],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const validationErrors = validateForm(values);
      if (Object.keys(validationErrors).length) {
        setErrors(validationErrors);
        return;
      }

      setErrors(null);
      forgotPasswordMutation.mutate({ email: values.email.trim() });
    },
    [forgotPasswordMutation, validateForm, values],
  );

  if (forgotPasswordMutation.isSuccess) {
    return (
      <Layout isAuthPage={true}>
        <div className="flex h-full flex-col bg-gray-50 dark:bg-black">
          <div className="flex flex-1 flex-col items-center justify-center p-4">
            <div className="relative z-10 w-full max-w-md space-y-6">
              {/* Status Icon */}
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-blue-500 dark:text-blue-400" />
              </div>

              <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="mb-6 space-y-2 text-center">
                  <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    Check Your Email
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We've sent a password reset link to your email
                  </p>
                </div>

                <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Check your email and follow the link to reset your password. The link will
                    expire in 24 hours.
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={() => navigate('/login')}
                    variant="unstyled"
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-700 active:bg-blue-800"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign in
                  </Button>
                </div>
              </div>

              <div className="space-y-1 text-center text-xs text-gray-500 dark:text-gray-400">
                <p>Can't find the email? Check your spam folder.</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const title = 'Forgot Password';
  const subtitle = 'Enter your email to receive a reset link';

  return (
    <ForgotPasswordPageLayout title={title} subtitle={subtitle}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {forgotPasswordMutation.error && (
          <div className="animate-fadeIn rounded-xl border border-red-500/20 bg-red-500/10 p-4 backdrop-blur-sm">
            <p className="text-sm font-medium text-red-400">
              {forgotPasswordMutation.error.message.includes('contact@claudex.pro') ? (
                <>
                  Email not found. Please check your email or contact support at{' '}
                  <a
                    href="mailto:contact@claudex.pro"
                    className="underline transition-colors hover:text-red-300"
                  >
                    contact@claudex.pro
                  </a>
                </>
              ) : (
                forgotPasswordMutation.error.message
              )}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-700 dark:text-gray-300">
              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Email address
            </Label>
            <Input
              type="email"
              value={values.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="name@example.com"
              hasError={Boolean(errors?.email)}
            />
            <FieldMessage variant="error">{errors?.email}</FieldMessage>
          </div>
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="mt-6 w-full transform shadow-lg hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
          isLoading={forgotPasswordMutation.isPending}
          loadingText="Sending..."
          loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
        >
          <span
            className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden="true"
          />
          <Mail className="h-4 w-4" />
          <span>Send Reset Link</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Button>
      </form>

      <div className="pt-4 text-center">
        <Button
          type="button"
          variant="link"
          className="flex items-center justify-center gap-1 text-sm"
          onClick={() => navigate('/login')}
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Sign in
        </Button>
      </div>
    </ForgotPasswordPageLayout>
  );
}
