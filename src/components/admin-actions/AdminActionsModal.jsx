import React from 'react';
import { Eye, EyeOff, Star, Trash2, Ban, UserX, Share2, Lock, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AdminActionsModal({
    isOpen,
    onClose,
    targetType, 
    targetData,
    currentUser,
    onAction
}) {
    const { t } = useLanguage();

    if (!isOpen || !currentUser) return null;

    const isChart = targetType === 'chart';
    const isUser = targetType === 'user';
    const isOwner = isChart && targetData?.authorId === currentUser?.sonolus_id;
    const isModOrAdmin = currentUser.isMod || currentUser.isAdmin;

    return (
        <>
            <div
                className="modal-overlay"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 9998
                }}
            />
            <div className="glass-dropdown-menu mod-actions-modal" style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90vw',
                maxWidth: '400px',
                zIndex: 9999,
                padding: '24px',
                borderRadius: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                margin: 0,
                display: 'block' 
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem', color: 'white' }}>
                    {t('userProfile.adminActions', 'Staff Actions')}
                </h3>

                {isChart && (isModOrAdmin || isOwner) && (
                    <>
                        <div className="glass-dropdown-label">{t('userProfile.moderation', 'Moderation')}</div>
                        <button
                            onClick={() => { onClose(); onAction('toggleVisibility'); }}
                            className="glass-dropdown-item"
                        >
                            {targetData.status === 2 ? <EyeOff size={16} /> : <Eye size={16} />}
                            <span>{targetData.status === 2 ? t('levelDetail.makePrivate', 'Make Private') : t('levelDetail.makePublic', 'Make Public')}</span>
                        </button>

                        {isModOrAdmin && (
                            <button
                                onClick={() => { onClose(); onAction('toggleStaffPick'); }}
                                className="glass-dropdown-item"
                            >
                                <Star size={16} />
                                <span>{targetData.staffPick ? t('levelDetail.removeStaffPick', 'Remove Staff Pick') : t('levelDetail.makeStaffPick', 'Make Staff Pick')}</span>
                            </button>
                        )}

                        {(currentUser.isAdmin || isOwner) && (
                            <button
                                onClick={() => { onClose(); onAction('deleteChart'); }}
                                className="glass-dropdown-item danger"
                            >
                                <Trash2 size={16} />
                                <span>{t('levelDetail.deleteChart', 'Delete Chart')}</span>
                            </button>
                        )}
                    </>
                )}

                {isUser && currentUser.isAdmin && (
                    <>
                        <div className="glass-dropdown-label">{t('userProfile.adminActions', 'Admin Actions')}</div>
                        {targetData.isBanned ? (
                            <button
                                onClick={() => { onClose(); onAction('unbanUser'); }}
                                className="glass-dropdown-item"
                            >
                                <ShieldCheck size={16} />
                                <span>{t('userProfile.unbanUser', 'Unban User')}</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => { onClose(); onAction('banUser'); }}
                                className="glass-dropdown-item warning"
                            >
                                <Ban size={16} />
                                <span>{t('userProfile.banUser', 'Ban User')}</span>
                            </button>
                        )}
                        <button
                            onClick={() => { onClose(); onAction('deleteAccount'); }}
                            className="glass-dropdown-item danger"
                        >
                            <UserX size={16} />
                            <span>{t('userProfile.deleteAccountData', 'Delete Account Data')}</span>
                        </button>
                    </>
                )}

                <button
                    onClick={onClose}
                    className="mobile-only-close-btn"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '14px',
                        justifyContent: 'center',
                        marginTop: '16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: 'white',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {t('common.close', 'Close')}
                </button>
            </div>
        </>
    );
}
