import axios from 'axios';

const AUTH_STORAGE_KEY = 'vyonic-auth-user';
const TOKEN_STORAGE_KEY = 'vyonic-auth-token';

const getLoginUrl = () => process.env.REACT_APP_LOGIN_API_URL || '/api/auth/v1/login';
const getRegisterUrl = () => process.env.REACT_APP_REGISTER_API_URL || '/api/auth/v2/register';
const getLogoutUrl = () => process.env.REACT_APP_LOGOUT_API_URL || '/api/auth/v1/logout';

const parseApiError = (error, fallbackMessage) => {
	if (error.response?.data) {
		const data = error.response.data;
		if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
			return data.errors.join(', ');
		}
		if (data.message) return data.message;
		if (data.error) return data.error;
	}
	return error.message || fallbackMessage;
};

// Switched to sessionStorage
export const saveLocalUser = (user, token = null) => {
	window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
	if (token) {
		window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
	}
	return user;
};

// Switched to sessionStorage
export const getLocalUser = () => {
	try {
		return JSON.parse(window.sessionStorage.getItem(AUTH_STORAGE_KEY) || 'null');
	} catch (_) {
		return null;
	}
};

// Switched to sessionStorage
export const getLocalToken = () => window.sessionStorage.getItem(TOKEN_STORAGE_KEY);

// Async API-integrated logout using Axios
export const logout = async () => {
	const url = getLogoutUrl();
	const token = getLocalToken();

	try {
		// Only hit the API if a token exists
		if (token) {
			await axios.post(url, {}, {
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});
		}
	} catch (error) {
		console.error('Server logout failed:', parseApiError(error, 'Logout error'));
	} finally {
		// Always clear local storage tokens even if backend fails
		window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
		window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
	}
};

export const login = async ({ email, password, remember }) => {
	const url = getLoginUrl();
	try {
		const response = await axios.post(url, {
			email: email?.trim(),
			password,
			remember,
		});

		const data = response.data;
		if (data.success === false) {
			throw new Error(data.message || 'Authentication failed');
		}

		const user = data.data?.user || data.user || { email };
		const token = data.data?.token || data.token || null;
		saveLocalUser(user, token);

		return data;
	} catch (error) {
		throw new Error(parseApiError(error, 'Authentication failed'));
	}
};

export const registerClient = async (clientData) => {
	const url = getRegisterUrl();
	const formData = new FormData();

	formData.append('first_name', clientData.firstName?.trim() || clientData.first_name || '');
	formData.append('last_name', clientData.lastName?.trim() || clientData.last_name || '');
	formData.append('country_code', clientData.countryCode || clientData.country_code || '+971');
	formData.append('phone', clientData.phone?.trim() || '');
	formData.append('email', clientData.email?.trim() || '');
	if (clientData.dob || clientData.date_of_birth) {
		formData.append('date_of_birth', clientData.dob || clientData.date_of_birth);
	}
	if (clientData.gender) {
		formData.append('gender', clientData.gender);
	}
	formData.append('role', clientData.role || 'user');
	formData.append('registration_source', clientData.registration_source || 'VYONIC');

	try {
		const response = await axios.post(url, formData);
		const data = response.data;

		if (data.success === false) {
			const message = (data.errors && data.errors.length > 0) ? data.errors.join(', ') : (data.message || 'Registration failed');
			throw new Error(message);
		}

		return data;
	} catch (error) {
		throw new Error(parseApiError(error, 'Registration failed'));
	}
};

export const register = async ({ name, email, password }) => {
	const signupUrl = process.env.REACT_APP_SIGNUP_API_URL;

	if (signupUrl) {
		try {
			const response = await axios.post(signupUrl, {
				name: name?.trim(),
				email: email?.trim(),
				password,
			});

			const data = response.data;
			if (data.success === false) {
				throw new Error(data.message || 'Signup failed');
			}

			return data;
		} catch (error) {
			throw new Error(parseApiError(error, 'Signup failed'));
		}
	}

	const storedUser = { name: name?.trim(), email: email?.trim(), password };
	saveLocalUser(storedUser);
	return { success: true, user: storedUser };
};
