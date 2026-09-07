import axios from 'axios';

const AUTH_STORAGE_KEY = 'vyonic-auth-user';
const TOKEN_STORAGE_KEY = 'vyonic-auth-token';

const getLoginUrl = () => process.env.REACT_APP_LOGIN_API_URL || '/auth/v1/login';
const getRegisterUrl = () => process.env.REACT_APP_REGISTER_API_URL || '/auth/v2/register';
const getLogoutUrl = () => process.env.REACT_APP_LOGOUT_API_URL || '/auth/v1/logout';
const getDashboardUrl = () => process.env.REACT_APP_DASHBOARD_API_URL || '/vyonic/v1/today-bookings';
const getDashboardStatsUrl = () => process.env.REACT_APP_DASHBOARD_STATS_API_URL || '/vyonic/v1/dashboard';
const getClientUrl = () => process.env.REACT_APP_CLIENT_API_URL || '/vyonic/v1/vyonic-users';
const getPartnerUrl = () => process.env.REACT_APP_PARTNER_API_URL || '/vyonic/v1/partners-list';
const getPartnerProfileUpdateUrl = () => process.env.REACT_APP_PARTNER_PROFILE_API_URL || '/vyonic/v1/partner-profile';
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

export const saveLocalUser = (user, token = null, remember = false) => {
	const storage = remember ? window.localStorage : window.sessionStorage;
	const otherStorage = remember ? window.sessionStorage : window.localStorage;

	otherStorage.removeItem(AUTH_STORAGE_KEY);
	otherStorage.removeItem(TOKEN_STORAGE_KEY);
	storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
	if (token) {
		storage.setItem(TOKEN_STORAGE_KEY, token);
	}
	window.dispatchEvent(new Event('vyonic-auth-changed'));
};

export const getLocalUser = () => {
	try {
		return JSON.parse(
			window.localStorage.getItem(AUTH_STORAGE_KEY) ||
			window.sessionStorage.getItem(AUTH_STORAGE_KEY) ||
			'null'
		);
	} catch (_) {
		return null;
	}
};

export const getLocalToken = () =>
	window.localStorage.getItem(TOKEN_STORAGE_KEY) ||
	window.sessionStorage.getItem(TOKEN_STORAGE_KEY);

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
		window.localStorage.removeItem(AUTH_STORAGE_KEY);
		window.localStorage.removeItem(TOKEN_STORAGE_KEY);
		window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
		window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
		window.dispatchEvent(new Event('vyonic-auth-changed'));
	}
};

// 2. Add this exported function at the bottom of auth.js
export const getDashboardData = async (status, page = 1, limit = 10) => {
	const url = getDashboardUrl();
	const token = getLocalToken(); // Automatically fetches token from sessionStorage

	try {
		const response = await axios.post(url, {
			page,
			limit,
			search: "",
			timezone: "Asia/Kolkata",
			booking_status: status,
		}, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		return response.data;
	} catch (error) {
		throw new Error(parseApiError(error, 'Failed to fetch dashboard data'));
	}
};

export const getDashboardStats = async () => {
	const url = getDashboardStatsUrl();
	const token = getLocalToken();

	try {
		const response = await axios.get(url, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});
		// API returns { success, message, data: { clients, partners, assessments, journeys } }
		return response.data?.data || response.data || {};
	} catch (error) {
		throw new Error(parseApiError(error, 'Failed to fetch dashboard stats'));
	}
};

export const getClientData = async (status = 'all', page = 1, limit = 10, search = '') => {
	const url = getClientUrl();
	const token = getLocalToken();

	try {
		const response = await axios.post(url, {
			page,
			limit,
			search,
			status: status === 'all' ? '' : status,
		}, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		return response.data;
	} catch (error) {
		throw new Error(parseApiError(error, 'Failed to fetch client data'));
	}
};

export const getWorkLocations = async () => {
	const token = getLocalToken();
	const url = '/vyonic/v1/work-locations';

	try {
		const response = await axios.get(url, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		return response.data;
	} catch (error) {
		console.error('[getWorkLocations] GET failed:', error?.response?.status, error?.message);
		return null;
	}
};

export const getPartnerProfileDetails = async (userUuid) => {
	const token = getLocalToken();
	const detailsPath = process.env.REACT_APP_PARTNER_DETAILS_API_URL || '/vyonic/v1/profile-details';
	const cleanPath = detailsPath.startsWith('/') ? detailsPath : `/${detailsPath}`;
	const url = `${cleanPath}?user_uuid=${userUuid}`;

	try {
		const response = await axios.get(url, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		return response.data;
	} catch (error) {
		console.error('[getPartnerProfileDetails] GET failed:', error?.response?.status, error?.message);
		throw new Error(parseApiError(error, 'Failed to fetch partner profile details'));
	}
};

export const getPartnerData = async (status = 'all', page = 1, limit = 10, search = '') => {
	const url = getPartnerUrl();
	const token = getLocalToken();

	const payload = {
		page,
		limit,
		search,
	};
	if (status && status !== 'all') {
		payload.status = status;
		payload.approval_status = status;
	}

	try {
		const response = await axios.post(url, payload, {
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		// Return full body — Partner.jsx handles unwrapping
		return response.data;
	} catch (error) {
		console.error('[getPartnerData] POST failed:', error?.response?.status, error?.message);
		throw new Error(parseApiError(error, 'Failed to fetch partner data'));
	}
};

export const updatePartnerProfile = async (profileData) => {
	const url = getPartnerProfileUpdateUrl();
	const token = getLocalToken();
	const method = (process.env.REACT_APP_PARTNER_PROFILE_API_METHOD || 'put').toLowerCase();

	try {
		const response = await axios({
			method,
			url,
			data: profileData,
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		return response.data;
	} catch (error) {
		console.error('[updatePartnerProfile] request failed:', error?.response?.status, error?.message);
		throw new Error(parseApiError(error, 'Failed to update partner profile'));
	}
};

export const getDeviceId = () => {
	const DEVICE_STORAGE_KEY = 'vyonic-device-id';
	let deviceId = window.localStorage.getItem(DEVICE_STORAGE_KEY);
	if (!deviceId) {
		if (typeof crypto !== 'undefined' && crypto.randomUUID) {
			deviceId = crypto.randomUUID();
		} else {
			deviceId = 'vyonic_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
		}
		window.localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
	}
	return deviceId;
};

const getGoogleLoginUrl = () => process.env.REACT_APP_GOOGLE_LOGIN_API_URL || '/auth/v1/google-login';

export const googleLogin = async ({ accessToken, role = 'user', fcmToken = '' }) => {
	const url = getGoogleLoginUrl();
	const deviceId = getDeviceId();
	const payload = {
		access_token: accessToken,
		id_token: accessToken,
		role: role || 'user',
		device_id: deviceId,
		fcm_token: fcmToken ?? '',
	};

	if (process.env.NODE_ENV === 'development') {
		console.log('[Google Login] URL:', url);
		console.log('[Google Login] access_token present:', Boolean(accessToken));
		console.log('[Google Login] payload:', {
			role: payload.role,
			device_id: payload.device_id,
			fcm_token_present: Boolean(payload.fcm_token),
			access_token_present: Boolean(payload.access_token),
			id_token_present: Boolean(payload.id_token),
		});
	}

	try {
		const response = await axios.post(url, payload);
		const data = response.data;
		console.log("data::::", data);

		if (data.success === false) {
			throw new Error(data.message || 'Google authentication failed');
		}

		const user = data.data?.user || data.user || null;
		const token = data.data?.token || data.token || null;
		console.log('[Google Login] user:', user);
		console.log('[Google Login] token:', token);
		saveLocalUser(user, token, true);
		return data;
	} catch (error) {
		const parsedMessage = parseApiError(error, 'Google authentication failed');
		const apiError = new Error(parsedMessage);
		apiError.status = error.response?.status;
		apiError.response = error.response;
		throw apiError;
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
		saveLocalUser(user, token, remember);
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
