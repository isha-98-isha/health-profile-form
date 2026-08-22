import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/vyonic_logo_small.webp';
import heroLogo from '../../assets/vyonic_log_big.webp';
import { register } from '../../services/auth';
import '../Login/login.css';
import './signup.css';

function Signup() {
	const navigate = useNavigate();
	const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
	const [errors, setErrors] = useState({});
	const [status, setStatus] = useState({ type: '', message: '' });
	const [showPassword, setShowPassword] = useState(false);

	const updateField = (event) => {
		const { name, value } = event.target;
		setForm((current) => ({ ...current, [name]: value }));
		setErrors((current) => ({ ...current, [name]: '' }));
		setStatus({ type: '', message: '' });
	};

	const validate = () => {
		const nextErrors = {};
		if (!form.name.trim()) nextErrors.name = 'Full name is required';
		if (!form.email.trim()) nextErrors.email = 'Email is required';
		else if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email';
		if (form.password.length < 8) nextErrors.password = 'Use at least 8 characters';
		if (!form.confirmPassword) nextErrors.confirmPassword = 'Please confirm your password';
		else if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
		return nextErrors;
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		const nextErrors = validate();
		if (Object.keys(nextErrors).length) {
			setErrors(nextErrors);
			return;
		}
		setStatus({ type: 'loading', message: 'Creating your account...' });
		try {
			await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
			setStatus({ type: 'success', message: 'Account created. Redirecting...' });
			navigate('/login');
		} catch (error) {
			setStatus({ type: 'error', message: error.message || 'Unable to connect to the signup service' });
		}
	};

	const field = (name, label, type = 'text', autoComplete = name) => (
		<React.Fragment key={name}>
			<label htmlFor={`signup-${name}`}>{label}</label>
			<input id={`signup-${name}`} name={name} type={type} autoComplete={autoComplete} value={form[name]} onChange={updateField} placeholder={label} aria-invalid={Boolean(errors[name])} />
			{errors[name] && <span className="field-error">{errors[name]}</span>}
		</React.Fragment>
	);

	return (
		<main className="auth-page">
			<section className="auth-card signup-card" aria-label="VYONIC signup">
				<div className="auth-visual"><img src={heroLogo} alt="VYONIC emblem" /></div>
				<div className="auth-panel">
					<img className="auth-mark" src={logo} alt="VYONIC" />
					<p className="auth-eyebrow">Start your VYONIC journey</p>
					<h1>Create your account</h1>
					<form onSubmit={handleSubmit} noValidate>
						{field('name', 'Full name', 'text', 'name')}
						{field('email', 'Email', 'email', 'email')}
						<label htmlFor="signup-password">Password</label>
						<div className="password-field">
							<input id="signup-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={updateField} placeholder="At least 8 characters" aria-invalid={Boolean(errors.password)} />
							<button type="button" className="visibility-button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
						</div>
						{errors.password && <span className="field-error">{errors.password}</span>}
						{field('confirmPassword', 'Confirm password', 'password', 'new-password')}
						<button className="submit-button" type="submit" disabled={status.type === 'loading'}>{status.type === 'loading' ? 'Please wait...' : 'Create account'}</button>
						{status.message && <p className={`form-status ${status.type}`} role="status">{status.message}</p>}
					</form>
					<p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
				</div>
			</section>
		</main>
	);
}

export default Signup;
