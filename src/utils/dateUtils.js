export function formatRelativeTime(date, t) {
    if (!date) return "";

    // Safety check if t is not provided
    const translate = t || ((key, params) => {
        // Fallback for English if t is missing
        const map = {
            'time.year_singular': '{1} year ago', 'time.year_plural': '{1} years ago',
            'time.month_singular': '{1} month ago', 'time.month_plural': '{1} months ago',
            'time.day_singular': '{1} day ago', 'time.day_plural': '{1} days ago',
            'time.hour_singular': '{1} hour ago', 'time.hour_plural': '{1} hours ago',
            'time.minute_singular': '{1} minute ago', 'time.minute_plural': '{1} minutes ago',
            'time.second_singular': '{1} second ago', 'time.second_plural': '{1} seconds ago',
            'time.justNow': 'Just now'
        };
        let str = map[key] || key;
        if (params) {
            Object.keys(params).forEach(k => {
                str = str.replace(`{${k}}`, params[k]);
            });
        }
        return str;
    });

    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return translate(years === 1 ? 'time.year_singular' : 'time.year_plural', { 1: years });
    if (months > 0) return translate(months === 1 ? 'time.month_singular' : 'time.month_plural', { 1: months });
    if (days > 0) return translate(days === 1 ? 'time.day_singular' : 'time.day_plural', { 1: days });
    if (hours > 0) return translate(hours === 1 ? 'time.hour_singular' : 'time.hour_plural', { 1: hours });
    if (minutes > 0) return translate(minutes === 1 ? 'time.minute_singular' : 'time.minute_plural', { 1: minutes });
    return translate('time.justNow');
}
