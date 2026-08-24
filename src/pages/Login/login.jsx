import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/vyonic_logo_small.webp';
import heroLogo from '../../assets/vyonic_log_big.webp';
import { login } from '../../services/auth';
import './login.css';
import { FaEye, FaEyeSlash } from "react-icons/fa"; // eye icons

function Login() {
	const navigate = useNavigate();
	const [form, setForm] = useState({ email: '', password: '', remember: true });
	const [errors, setErrors] = useState({});
	const [status, setStatus] = useState({ type: '', message: '' });
	const [showPassword, setShowPassword] = useState(false);

	const updateField = (event) => {
		const { name, value, checked, type } = event.target;
		setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
		setErrors((current) => ({ ...current, [name]: '' }));
		setStatus({ type: '', message: '' });
	};

	const validate = () => {
		const nextErrors = {};
		if (!form.email.trim()) nextErrors.email = 'Email is required';
		else if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email';
		if (!form.password) nextErrors.password = 'Password is required';
		else if (form.password.length < 8) nextErrors.password = 'Use at least 8 characters';
		return nextErrors;
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		const nextErrors = validate();
		if (Object.keys(nextErrors).length) {
			setErrors(nextErrors);
			return;
		}

		setStatus({ type: 'loading', message: 'Signing you in...' });
		try {
			await login({ email: form.email.trim(), password: form.password, remember: form.remember });
			setStatus({ type: 'success', message: 'Signed in successfully.' });
			navigate('/dashboard');
		} catch (error) {
			setStatus({ type: 'error', message: error.message || 'Unable to connect to the login service' });
		}
	};

	return (
		<main className="auth-page">
			<section className="auth-card" aria-label="VYONIC login">
				<div className="auth-visual">
					<img src={heroLogo} alt="VYONIC emblem" />
				</div>
				<div className="auth-panel">
					<img className="auth-mark" src={logo} alt="VYONIC" />
					<p className="auth-eyebrow">Welcome back to VYONIC</p>
					<h1>Access your assessment dashboard</h1>
					<form onSubmit={handleSubmit} noValidate>
						<label htmlFor="login-email">Email</label>
						<input id="login-email" name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} placeholder="you@example.com" aria-invalid={Boolean(errors.email)} />
						{errors.email && <span className="field-error">{errors.email}</span>}

						<label htmlFor="login-password">Password</label>
							<div className="password-field">
							<input
								id="login-password"
								name="password"
								type={showPassword ? "text" : "password"}
								autoComplete="current-password"
								value={form.password}
								onChange={updateField}
								placeholder="Enter your password"
								aria-invalid={Boolean(errors.password)}
							/>
							<button
								type="button"
								className="visibility-button"
								onClick={() => setShowPassword((visible) => !visible)}
								aria-label={showPassword ? "Hide password" : "Show password"}
							>
								{showPassword ? <FaEyeSlash /> : <FaEye />}
							</button>
							</div>
							{errors.password && <span className="field-error">{errors.password}</span>}

						<div className="auth-options">
							<label className="remember-option"><input name="remember" type="checkbox" checked={form.remember} onChange={updateField} /> Keep me signed in</label>
							<button type="button" className="text-button" onClick={() => setStatus({ type: 'info', message: 'Password reset is available through your API.' })}>Forgot password?</button>
						</div>
						<button className="submit-button" type="submit" disabled={status.type === 'loading'}>{status.type === 'loading' ? 'Please wait...' : 'Continue'}</button>
						{status.message && <p className={`form-status ${status.type}`} role="status">{status.message}</p>}
					</form>
					<p className="auth-switch">New to VYONIC Training app? <Link to="/signup">Create an account</Link></p>
				</div>
			</section>
		</main>
	);
}

export default Login;
