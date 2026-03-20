"use client";
import { useState, useEffect, useRef } from "react";
import { X, Upload, Check, AlertCircle, Trash2, Pencil } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import Cropper from "react-easy-crop";
import "./EditProfileModal.css";
import EmojiSuggestion from "../emoji-suggestion/EmojiSuggestion";
import { createPortal } from "react-dom";


function getCroppedImg(imageSrc, pixelCrop) {
    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", (error) => reject(error));
            image.setAttribute("crossOrigin", "anonymous");
            image.src = url;
        });

    return new Promise(async (resolve, reject) => {
        try {
            const image = await createImage(imageSrc);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;

            ctx.drawImage(
                image,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                pixelCrop.width,
                pixelCrop.height
            );

            canvas.toBlob((blob) => {
                resolve(blob);
            }, "image/png");
        } catch (e) {
            reject(e);
        }
    });
}

export default function EditProfileModal({ isOpen, onClose, user, onUpdate, assetBaseUrl }) {
    const { t } = useLanguage();
    const [description, setDescription] = useState(user?.description || "");
    const [pfpFile, setPfpFile] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [pfpPreview, setPfpPreview] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const descriptionRef = useRef(null);
    const [emojiOpen, setEmojiOpen] = useState(false); 

    
    const ACCEPTED_TYPES = "image/png, image/jpeg, image/webp";

    
    const [cropImage, setCropImage] = useState(null); 
    const [cropType, setCropType] = useState(null); 
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
            document.documentElement.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
            document.documentElement.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
            setError(t('profile.invalidFormat', 'Invalid file format. Please use PNG, JPEG, or WebP.'));
            return;
        }

        const url = URL.createObjectURL(file);
        setCropImage(url);
        setCropType(type);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setError(null);
    };

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropSave = async () => {
        try {
            const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels);
            const file = new File([croppedBlob], "cropped.png", { type: "image/png" });
            const url = URL.createObjectURL(croppedBlob);

            if (cropType === 'profile') {
                setPfpFile(file);
                setPfpPreview(url);
            } else {
                setBannerFile(file);
                setBannerPreview(url);
            }
            setCropImage(null);
            setCropType(null);
        } catch (e) {
            console.error(e);
            setError("Failed to crop image");
        }
    };

    const handleDeleteImage = async (type) => {
        if (!confirm(`Are you sure you want to remove your ${type}?`)) return;
        setLoading(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL;
            const token = localStorage.getItem("session");
            const endpoint = type === 'profile' ? 'profile' : 'banner';

            const res = await fetch(`${apiBase}/api/accounts/${user.sonolus_id}/${endpoint}`, {
                method: 'DELETE',
                headers: { "Authorization": token }
            });

            if (!res.ok) throw new Error(`Failed to delete ${type}`);

            if (type === 'profile') {
                setPfpFile(null);
                setPfpPreview(null);
            } else {
                setBannerFile(null);
                setBannerPreview(null);
            }
            onUpdate();
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const ALLOWED_LINKS = [
        /^https?:\/\/(www\.)?discord\.gg\/UntitledCharts/,
        /^https?:\/\/(www\.)?reddit\.com\/r\/OurStage/,
        /^https?:\/\/(www\.)?ourstage\.miraheze\.org/
    ];

    const validateLinks = (text) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = text.match(urlRegex);
        if (!matches) return true;

        for (const url of matches) {
            let allowed = false;
            for (const pattern of ALLOWED_LINKS) {
                if (pattern.test(url)) {
                    allowed = true;
                    break;
                }
            }
            if (!allowed) return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!validateLinks(description)) {
            setToast({ message: t('profile.invalidLinks', 'Description contains non-whitelisted links. Only UntitledCharts Discord, OurStage Reddit/Wiki are allowed.') });
            setLoading(false);
            return;
        }

        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        const token = localStorage.getItem("session");

        let newPfpHash = null;
        let newBannerHash = null;

        try {
            if (pfpFile) {
                const formData = new FormData();
                formData.append("file", pfpFile);
                const res = await fetch(`${apiBase}/api/accounts/${user.sonolus_id}/profile/upload`, {
                    method: "POST",
                    headers: { "Authorization": token },
                    body: formData
                });

                if (!res.ok) {
                    const errText = await res.text();
                    throw new Error("Failed to upload profile picture: " + errText);
                }

                try {
                    const data = await res.json();
                    if (data.hash) newPfpHash = data.hash;
                } catch (e) {
                    
                }
            }

            if (bannerFile) {
                const formData = new FormData();
                formData.append("file", bannerFile);
                const res = await fetch(`${apiBase}/api/accounts/${user.sonolus_id}/banner/upload`, {
                    method: "POST",
                    headers: { "Authorization": token },
                    body: formData
                });

                if (!res.ok) {
                    const errText = await res.text();
                    throw new Error("Failed to upload banner: " + errText);
                }

                try {
                    const data = await res.json();
                    if (data.hash) newBannerHash = data.hash;
                } catch (e) {
                    
                }
            }

            if (description !== user.description || newPfpHash || newBannerHash) {
                const payload = { description };
                if (newPfpHash) {
                    payload.profile_hash = newPfpHash;
                    payload.profile_image_hash = newPfpHash; 
                    payload.pfp = newPfpHash;
                    payload.hash = newPfpHash;
                }
                if (newBannerHash) {
                    payload.banner_hash = newBannerHash;
                    payload.banner_image_hash = newBannerHash; 
                    payload.banner = newBannerHash;
                }

                try {
                    const res = await fetch(`${apiBase}/api/accounts/${user.sonolus_id}/description`, {
                        method: "POST",
                        headers: { "Authorization": token, "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });

                    if (!res.ok) {
                        await res.text().catch(() => "");
                    } else {
                        await res.json().catch(() => ({}));
                    }
                } catch (e) {
                    
                }

                if (false) {
                    try {
                        const res = await fetch(`${apiBase}/api/accounts/${user.sonolus_id}`, {
                            method: "POST",
                            headers: { "Authorization": token, "Content-Type": "application/json" },
                            body: JSON.stringify(payload)
                        });

                        if (res.ok) {
                            await res.json().catch(() => ({}));
                        } else {
                            await res.text().catch(() => "");
                        }
                    } catch (e) {
                        
                    }
                }
            }

            onUpdate();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="modal-overlay">
            <div className="modal-content edit-profile-modal custom-scrollbar">
                {}
                <div className="modal-header">
                    <h2>{t('profile.editProfile', 'Edit Profile')}</h2>
                    <button onClick={onClose} className="close-btn"><X size={24} /></button>
                </div>

                {error && <div className="error-message"><AlertCircle size={16} /> {error}</div>}

                {cropImage ? (
                    
                    <div className="cropper-container">
                        <div className="cropper-wrapper">
                            <Cropper
                                image={cropImage}
                                crop={crop}
                                zoom={zoom}
                                aspect={cropType === 'profile' ? 1 : 3}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>
                        <div className="cropper-controls">
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(e.target.value)}
                                className="zoom-range"
                            />
                            <div className="cropper-actions">
                                <button onClick={() => setCropImage(null)} className="btn-cancel">{t('common.cancel', 'Cancel')}</button>
                                <button onClick={handleCropSave} className="btn-save">{t('common.apply', 'Apply')}</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="edit-profile-form">
                        <div className="form-group">
                            <label className="section-label">{t('profile.avatar', 'Avatar')}</label>
                            <div className="image-upload-section">
                                <div className="image-upload-preview">
                                    <div className="preview-circle">
                                        {(pfpPreview || (user.profile_hash && assetBaseUrl)) ? (
                                            <img src={pfpPreview || `${assetBaseUrl}/${user.sonolus_id}/profile/${user.profile_hash}_webp`} alt="Avatar" />
                                        ) : (
                                            <img src="/defpfp.webp" alt="Default Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        )}
                                    </div>
                                    <div className="upload-controls">
                                        <label className="upload-btn">
                                            {(pfpPreview || (user.profile_hash && assetBaseUrl)) ? <Pencil size={16} /> : <Upload size={16} />}
                                            <span>{(pfpPreview || (user.profile_hash && assetBaseUrl)) ? t('common.change', 'Change') : t('common.upload', 'Upload')}</span>
                                            <input type="file" accept={ACCEPTED_TYPES} onChange={(e) => handleFileChange(e, 'profile')} hidden />
                                        </label>
                                        {(pfpPreview || (user.profile_hash && assetBaseUrl)) && (
                                            <button type="button" onClick={() => handleDeleteImage('profile')} className="btn-delete-image" title="Remove Avatar">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="section-label">{t('profile.banner', 'Banner')}</label>
                            <div className="image-upload-section">
                                <div className="image-upload-preview banner-preview-container">
                                    <div className="preview-rect">
                                        {(bannerPreview || (user.banner_hash && assetBaseUrl)) ? (
                                            <img src={bannerPreview || `${assetBaseUrl}/${user.sonolus_id}/banner/${user.banner_hash}_webp`} alt="Banner" />
                                        ) : (
                                            <div className="placeholder-banner" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.5, height: '100%' }}>
                                                <Upload size={24} />
                                                <span>{t('profile.noBanner', 'No Banner')}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="upload-controls" style={{ alignSelf: 'flex-start', marginTop: '12px' }}>
                                        <label className="upload-btn">
                                            {(bannerPreview || (user.banner_hash && assetBaseUrl)) ? <Pencil size={16} /> : <Upload size={16} />}
                                            <span>{(bannerPreview || (user.banner_hash && assetBaseUrl)) ? t('common.change', 'Change') : t('common.upload', 'Upload')}</span>
                                            <input type="file" accept={ACCEPTED_TYPES} onChange={(e) => handleFileChange(e, 'banner')} hidden />
                                        </label>
                                        {(bannerPreview || (user.banner_hash && assetBaseUrl)) && (
                                            <button type="button" onClick={() => handleDeleteImage('banner')} className="btn-delete-image" title="Remove Banner">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-group relative">
                            <label className="section-label">{t('profile.description', 'Description')}</label>
                            <textarea
                                ref={descriptionRef}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                maxLength={2000}
                                rows={5}
                                placeholder={t('profile.descriptionPlaceholder', 'Tell us about yourself...')}
                            />
                            <EmojiSuggestion
                                value={description}
                                textareaRef={descriptionRef}
                                onSelect={(newVal) => setDescription(newVal)}
                                isOpen={emojiOpen}
                                setIsOpen={setEmojiOpen}
                            />
                        </div>

                        <div className="modal-actions">
                            <button type="button" onClick={onClose} className="btn-cancel">
                                <X size={18} /> <span>{t('common.cancel', 'Cancel')}</span>
                            </button>
                            <button type="submit" disabled={loading} className="btn-save">
                                {loading ? <div className="spinner-small"></div> : <><Check size={18} /> <span>{t('common.save', 'Save')}</span></>}
                            </button>
                        </div>
                    </form>
                )}
                {toast && <ToastNotification message={toast.message} onClose={() => setToast(null)} />}
            </div>
        </div>,
        document.body
    );
}

function ToastNotification({ message, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="toast-notification animate-slide-in-right">
            <AlertCircle size={20} />
            <span>{message}</span>
            <button onClick={onClose} className="toast-close">
                <X size={16} />
            </button>
        </div>
    );
}
