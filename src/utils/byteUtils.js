export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    if (!bytes || isNaN(bytes)) return '...';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    let value = bytes / Math.pow(k, i);

    
    if (i >= 1) {
        value = (Math.round(value * 4) / 4).toString();
    } else {
        value = value.toFixed(decimals);
    }

    
    return value + ' ' + sizes[i];
};
