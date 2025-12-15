import { memo, type ReactNode, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, Mail, Lock, Zap, type LucideIcon } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Button, FieldMessage, Input, Label } from '@/components/ui';
import { useAuthStore } from '@/store';
import { useLoginMutation } from '@/hooks/queries';
import { isValidEmail } from '@/utils/validation';

interface LoginFormData {
  email: string;
  password: string;
}

type LoginFormErrors = Partial<Record<keyof LoginFormData, string>>;

interface LoginPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const LoginPageLayout = memo(function LoginPageLayout({
  title,
  subtitle,
  children,
}: LoginPageLayoutProps) {
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

const validateForm = (values: LoginFormData): LoginFormErrors | null => {
  const errors: LoginFormErrors = {};

  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(values.email)) {
    errors.email = 'Invalid email address';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  }

  return Object.keys(errors).length ? errors : null;
};

const getFieldConfigs = (
  onForgotPassword: () => void,
): Array<{
  name: keyof LoginFormData;
  label: string;
  placeholder: string;
  type: 'email' | 'password';
  icon: LucideIcon;
  action?: ReactNode;
}> => [
  {
    name: 'email',
    label: 'Email address',
    placeholder: 'name@example.com',
    type: 'email',
    icon: Mail,
  },
  {
    name: 'password',
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password',
    icon: Lock,
    action: (
      <Button type="button" variant="link" className="text-sm" onClick={onForgotPassword}>
        Forgot password?
      </Button>
    ),
  },
];

export function LoginPage() {
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const navigate = useNavigate();
  const [values, setValues] = useState<LoginFormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginFormErrors | null>(null);

  const loginMutation = useLoginMutation({
    onSuccess: () => {
      setAuthenticated(true);
      navigate('/');
    },
  });

  const handleChange = (name: keyof LoginFormData, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev?.[name]) {
        return prev;
      }

      const rest = { ...prev };
      delete rest[name];
      return Object.keys(rest).length ? rest : null;
    });
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const validationErrors = validateForm(values);
      if (validationErrors) {
        setErrors(validationErrors);
        return;
      }

      setErrors(null);
      const attemptValues = { ...values };
      loginMutation.mutate(
        {
          username: attemptValues.email,
          password: attemptValues.password,
        },
        {
          onError: (error) => {
            if (error.message.includes('Email not verified')) {
              sessionStorage.setItem('pending_verification_email', attemptValues.email);
              navigate('/verify-email');
            }
          },
        },
      );
    },
    [loginMutation, navigate, values],
  );

  const title = 'Welcome to Claudex';
  const subtitle = 'Sign in to continue to your account';

  const isSubmitting = loginMutation.isPending;
  const error = loginMutation.error?.message;
  const fieldConfigs = getFieldConfigs(handleForgotPassword);

  return (
    <LoginPageLayout title={title} subtitle={subtitle}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="animate-fadeIn rounded-xl border border-red-500/20 bg-red-500/10 p-4 backdrop-blur-sm">
            <p className="text-sm font-medium text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {fieldConfigs.map(({ name, label, placeholder, type, icon: Icon, action }) => (
            <div key={name} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-700 dark:text-gray-300">
                  <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  {label}
                </Label>
                {action}
              </div>
              <Input
                type={type}
                value={values[name]}
                onChange={(e) => handleChange(name, e.target.value)}
                placeholder={placeholder}
                autoComplete={type === 'password' ? 'current-password' : 'email'}
                hasError={Boolean(errors?.[name])}
              />
              <FieldMessage variant="error">{errors?.[name]}</FieldMessage>
            </div>
          ))}
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="mt-6 w-full transform shadow-lg hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
          isLoading={isSubmitting}
          loadingText="Signing in..."
          loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
        >
          <span
            className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden="true"
          />
          <Zap className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
          <span>Sign in</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Button>
      </form>

      <div className="pt-4 text-center">
        <Button
          type="button"
          variant="link"
          className="text-sm"
          onClick={() => navigate('/signup')}
        >
          Don't have an account? Create one
        </Button>
      </div>
    </LoginPageLayout>
  );
}
