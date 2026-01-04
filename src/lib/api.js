const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchWithAuth(url, options = {}) {
    const headers = {
        ...options.headers,
    };

    const res = await fetch(`${API_URL}${url}`, {
        ...options,
        credentials: 'include',
        headers,
    });

    if (!res.ok) {
        
        try {
            const errorData = await res.json();
            throw new Error(errorData.detail || `API Error: ${res.status}`);
        } catch (e) {
            throw new Error(`API Error: ${res.status}`);
        }
    }

    return res.json();
}

export const api = {
    getCharts: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchWithAuth(`/api/charts?${query}`);
    },

    getChart: async (id) => {
        return fetchWithAuth(`/api/charts/${id}`);
    },

    deleteChart: async (id) => {
        return fetchWithAuth(`/api/charts/${id}/delete/`, { method: 'POST' });
    },

    updateVisibility: async (id, intent) => {
        return fetchWithAuth(`/api/charts/${id}/visibility/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: intent }),
        });
    },

    toggleStaffPick: async (id, value) => {
        return fetchWithAuth(`/api/charts/${id}/stpick/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value }),
        });
    },

    getComments: async (id, page = 0) => {
        return fetchWithAuth(`/api/charts/${id}/comment/?page=${page}`);
    },

    postComment: async (id, content) => {
        return fetchWithAuth(`/api/charts/${id}/comment/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
        });
    },

    deleteComment: async (chartId, commentId) => {
        return fetchWithAuth(`/api/charts/${chartId}/comment/${commentId}/`, {
            method: 'DELETE',
        });
    },

    getNotifications: async (page = 0, onlyUnread = false) => {
        return fetchWithAuth(`/api/accounts/notifications/?page=${page}&only_unread=${onlyUnread}`);
    },

    markNotificationRead: async (id, isRead = true) => {
        return fetchWithAuth(`/api/accounts/notifications/${id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_read: isRead }),
        });
    },

    uploadChart: async (formData) => {
        const res = await fetch(`${API_URL}/api/charts/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Upload failed');
        }
        return res.json();
    }
};
