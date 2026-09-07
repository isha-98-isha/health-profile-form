import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/vyonic_logo_small.webp';
import heroLogo from '../../assets/vyonic_log_big.webp';
import { login, googleLogin } from '../../services/auth';
import { auth, firebaseConfigReady } from '../../services/firebase';
import './login.css';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from 'react-icons/fc';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { toast } from 'react-toastify';

function Login() {
	const navigate = useNavigate();
	const [form, setForm] = useState({ email: '', password: '', remember: true });
	const [errors, setErrors] = useState({});
	const [status, setStatus] = useState({ type: '', message: '' });
	const [showPassword, setShowPassword] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);

	const updateField = (event) => {
		const { name, value, checked, type } = event.target;
		setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
		setErrors((current) => ({ ...current, [name]: '' }));
		setStatus({ type: '', message: '' });
	};

	const handleGoogleSignIn = async () => {
		if (!firebaseConfigReady || !auth) {
			setStatus({ type: 'info', message: 'Add Firebase configuration to enable Google sign-in.' });
			return;
		}

		setGoogleLoading(true);
		setStatus({ type: 'loading', message: 'Connecting to Google...' });
		try {
			if (process.env.NODE_ENV === 'development') {
				console.log('Firebase initialized:', Boolean(auth));
				console.log('Google login started');
			}

			const provider = new GoogleAuthProvider();
			provider.addScope('email');
			provider.addScope('profile');
			provider.addScope('openid');

			const result = await signInWithPopup(auth, provider);
			console.log("result :::", result);

			const credential = GoogleAuthProvider.credentialFromResult(result);
			console.log("credential :::", credential);
			const accessToken = credential?.idToken;

			if (process.env.NODE_ENV === 'development') {
				console.log('Firebase initialized:', Boolean(auth));
				console.log('Google credential received:', Boolean(credential));
				console.log('Token exists:', Boolean(accessToken));
				console.log('Token format/type:', typeof accessToken === 'string' && accessToken.startsWith('ya29.') ? 'Google OAuth Access Token (ya29...)' : 'Other');
				console.log('Token length:', accessToken ? accessToken.length : 0);
			}

			if (!accessToken) {
				throw new Error('Could not extract Google OAuth access token from provider credentials.');
			}

			if (process.env.NODE_ENV === 'development') {
				console.log('Backend Google login request started');
			}

			setStatus({ type: 'loading', message: 'Verifying with server...' });
			await googleLogin({
				accessToken,
				role: 'user',
				fcmToken: '',
			});

			if (process.env.NODE_ENV === 'development') {
				console.log('Backend Google login successful');
			}

			// Clean up temporary user testing key if it exists
			window.localStorage.removeItem('vyonic-firebase-user');

			setStatus({ type: 'success', message: 'Signed in successfully with Google.' });
			toast.success('Login successfully');
			navigate('/dashboard');
		} catch (error) {
			if (process.env.NODE_ENV === 'development') {
				console.log('Backend response status:', error.status || error.response?.status || 'Error');
				console.error('Google sign-in error:', error);
			}

			if (error.code === 'auth/popup-closed-by-user') {
				setStatus({ type: 'error', message: 'Google sign-in was cancelled.' });
			} else {
				const errorMessage = error.message || 'Google sign-in failed.';
				setStatus({ type: 'error', message: errorMessage });
				toast.error(errorMessage);
			}
		} finally {
			setGoogleLoading(false);
		}
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
			const response = await login({ email: form.email.trim(), password: form.password, remember: form.remember });

			if (response && response.success !== false) {
				setStatus({ type: 'success', message: 'Signed in successfully.' });
				toast.success('login successfully');
				navigate('/dashboard');
				return;
			}

			throw new Error(response?.message || 'Authentication failed');
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
						<label htmlFor="login-email"></label>
						<input id="login-email"
							name="email" type="email"
							autoComplete="email"
							value={form.email}
							onChange={updateField}
							placeholder="Email"
							aria-invalid={Boolean(errors.email)} />
						{errors.email && <span className="field-error">{errors.email}</span>}

						<label htmlFor="login-password"></label>
						<div className="password-field">
							<input
								id="login-password"
								name="password"
								type={showPassword ? "text" : "password"}
								autoComplete="current-password"
								value={form.password}
								onChange={updateField}
								placeholder="Password"
								aria-invalid={Boolean(errors.password)}
							/>
							<button
								type="button"
								className="visibility-button"
								onClick={() => setShowPassword((visible) => !visible)}
								aria-label={showPassword ? "Hide password" : "Show password"}
							>
								{showPassword ? <FaEye /> : <FaEyeSlash />}
							</button>
						</div>
						{errors.password && <span className="field-error">{errors.password}</span>}

						<div className="auth-options">
							<label className="remember-option">
								<input name="remember" type="checkbox" checked={form.remember}
									onChange={updateField} /> <h3>Keep me signed in</h3></label>
							<button type="button" className="text-button"
								onClick={() => setStatus({ type: 'info', message: 'Password reset is available through your API.' })}>Forgot password ?</button>
						</div>
						<button className="submit-button" type="submit" disabled={status.type === 'loading' || !form.email.trim() || !form.password.trim()}>{status.type === 'loading' ? 'Please wait...' : 'Continue'}</button>
						<div className="auth-divider" aria-hidden="true"><span>or</span></div>
						<button className="google-button" type="button" onClick={handleGoogleSignIn} disabled={googleLoading || status.type === 'loading'}>
							<FcGoogle aria-hidden="true" />
							{googleLoading ? 'Connecting...' : 'Continue with Google'}
						</button>
						{status.message && <p className={`form-status ${status.type}`} role="status">{status.message}</p>}
					</form>
				</div>
			</section>
		</main>
	);
}

export default Login;
