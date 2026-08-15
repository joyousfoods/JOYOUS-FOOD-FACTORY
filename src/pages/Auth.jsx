import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Truck, Gift } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';
import { Alert } from '../components/ui/Misc';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PERKS = [
  { icon: Truck, text: 'Track every order from your account' },
  { icon: Gift, text: 'Save addresses and reorder in one tap' },
  { icon: ShieldCheck, text: 'Keep a wishlist across devices' },
];

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <div className="auth__panel">
        <Link to="/" className="auth__logo">
          <img src="/logo-removebg-preview.png" alt="Joyous Food Factory" />
        </Link>
        <h1>{title}</h1>
        <p className="auth__subtitle">{subtitle}</p>
        {children}
        <div className="auth__footer">{footer}</div>
      </div>

      <aside className="auth__aside">
        <blockquote>
          “Blending tradition with modern elegance — one chocolate beeda at a time.”
        </blockquote>
        <ul>
          {PERKS.map(({ icon: Icon, text }) => (
            <li key={text}>
              <Icon size={16} /> {text}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const next = params.get('next') || '/account';

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to track orders, reorder favourites and manage your addresses."
      footer={
        <>
          New here? <Link to={`/register?next=${encodeURIComponent(next)}`}>Create an account</Link>
        </>
      }
    >
      <form className="auth__form" onSubmit={submit}>
        {error && <Alert variant="danger">{error}</Alert>}

        <Field label="Email address" required>
          {(props) => (
            <Input
              {...props}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          )}
        </Field>

        <Field label="Password" required>
          {(props) => (
            <div className="auth__password">
              <Input
                {...props}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          )}
        </Field>

        <Button type="submit" variant="primary" size="lg" block loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { register } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const next = params.get('next') || '/account';

  const validate = () => {
    const found = {};
    if (form.name.trim().length < 2) found.name = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = 'Enter a valid email address';
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) {
      found.phone = 'Enter a valid 10-digit mobile number';
    }
    // Mirrors the server-side rule so the error appears before the request.
    if (form.password.length < 8) found.password = 'Use at least 8 characters';
    else if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      found.password = 'Include at least one letter and one number';
    }
    return found;
  };

  const submit = async (event) => {
    event.preventDefault();
    setError(null);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      const user = await register({ ...form, phone: form.phone || undefined });
      toast.success(`Welcome to Joyous Food Factory, ${user.name.split(' ')[0]}`);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes a minute and makes every future order faster."
      footer={
        <>
          Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link>
        </>
      }
    >
      <form className="auth__form" onSubmit={submit} noValidate>
        {error && <Alert variant="danger">{error}</Alert>}

        <Field label="Full name" error={errors.name} required>
          {(props) => (
            <Input
              {...props}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              autoComplete="name"
            />
          )}
        </Field>

        <Field label="Email address" error={errors.email} required>
          {(props) => (
            <Input
              {...props}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              autoComplete="email"
            />
          )}
        </Field>

        <Field label="Mobile number" error={errors.phone} hint="Optional — used for delivery updates">
          {(props) => (
            <Input
              {...props}
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
              }
              placeholder="10-digit mobile number"
              inputMode="numeric"
              autoComplete="tel"
            />
          )}
        </Field>

        <Field
          label="Password"
          error={errors.password}
          hint="At least 8 characters, with a letter and a number"
          required
        >
          {(props) => (
            <div className="auth__password">
              <Input
                {...props}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Create a password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          )}
        </Field>

        <Button type="submit" variant="primary" size="lg" block loading={loading}>
          Create account
        </Button>

        <p className="auth__legal">
          By creating an account you agree to our <Link to="/terms">Terms of Service</Link> and{' '}
          <Link to="/privacy-policy">Privacy Policy</Link>.
        </p>
      </form>
    </AuthShell>
  );
}
