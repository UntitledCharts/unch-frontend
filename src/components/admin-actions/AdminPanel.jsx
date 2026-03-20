import React from 'react';
import { Eye, EyeOff, Star, Trash2, Ban, UserX, ShieldCheck, Gauge, Crown, ShieldOff } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';


export default function AdminPanel({
    targetType,
    targetData,
    currentUser,
    onAction,
    className
}) {
    const { t } = useLanguage();

    if (!currentUser) return null;

    const isChart = targetType === 'chart';
    const isUser = targetType === 'user';
    const isOwner = isChart && targetData?.authorId === currentUser?.sonolus_id;
    const isModOrAdmin = currentUser.isMod || currentUser.isAdmin;

    
    if (isChart && !(isModOrAdmin || isOwner)) return null;
    if (isUser && !currentUser.isAdmin) return null;

    
    const actionButtonStyle = {
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        justifyContent: 'flex-start',
        transition: 'all 0.2s',
        fontSize: '0.9rem',
        fontWeight: '500'
    };

    const warningButtonStyle = {
        ...actionButtonStyle,
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        color: '#f59e0b'
    };

    const dangerButtonStyle = {
        ...actionButtonStyle,
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        color: '#ef4444'
    };

    const successButtonStyle = {
        ...actionButtonStyle,
        background: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.2)',
        color: '#22c55e'
    };

    const hoverIn = (e, bg, bc) => {
        e.currentTarget.style.background = bg;
        if (bc) e.currentTarget.style.borderColor = bc;
    };
    const hoverOut = (e, style) => {
        e.currentTarget.style.background = style.background;
        e.currentTarget.style.borderColor = style.border || style.borderColor || '';
    };

    return (
        <div className={className || 'stats-card admin-card'} style={{ marginBottom: '20px' }}>
            <h3 className="stats-title" style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} fill="currentColor" />
                {t('userProfile.adminActions', 'Staff Actions')}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {}
                {isChart && (
                    <>
                        {}
                        {isModOrAdmin ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button
                                    onClick={() => onAction('setVisibilityPublic')}
                                    className="btn-edit-profile"
                                    style={{ ...actionButtonStyle, justifyContent: 'center', background: targetData.status === 'PUBLIC' ? 'rgba(56, 189, 248, 0.2)' : actionButtonStyle.background, color: targetData.status === 'PUBLIC' ? '#38bdf8' : 'white', borderColor: targetData.status === 'PUBLIC' ? 'rgba(56, 189, 248, 0.4)' : actionButtonStyle.borderColor }}
                                >
                                    <Eye size={16} /> <span>{t('dashboard.public')}</span>
                                </button>
                                <button
                                    onClick={() => onAction('setVisibilityUnlisted')}
                                    className="btn-edit-profile"
                                    style={{ ...actionButtonStyle, justifyContent: 'center', background: targetData.status === 'UNLISTED' ? 'rgba(245, 158, 11, 0.2)' : actionButtonStyle.background, color: targetData.status === 'UNLISTED' ? '#f59e0b' : 'white', borderColor: targetData.status === 'UNLISTED' ? 'rgba(245, 158, 11, 0.4)' : actionButtonStyle.borderColor }}
                                >
                                    <ShieldOff size={16} /> <span>{t('dashboard.unlisted')}</span>
                                </button>
                                <button
                                    onClick={() => onAction('setVisibilityPrivate')}
                                    className="btn-edit-profile"
                                    style={{ ...actionButtonStyle, justifyContent: 'center', background: targetData.status === 'PRIVATE' ? 'rgba(239, 68, 68, 0.2)' : actionButtonStyle.background, color: targetData.status === 'PRIVATE' ? '#ef4444' : 'white', borderColor: targetData.status === 'PRIVATE' ? 'rgba(239, 68, 68, 0.4)' : actionButtonStyle.borderColor }}
                                >
                                    <EyeOff size={16} /> <span>{t('dashboard.private')}</span>
                                </button>
                            </div>
                        ) : isOwner && (
                            <button
                                onClick={() => onAction('toggleVisibility')}
                                className="btn-edit-profile"
                                style={actionButtonStyle}
                                onMouseEnter={(e) => hoverIn(e, 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)')}
                                onMouseLeave={(e) => hoverOut(e, actionButtonStyle)}
                            >
                                {targetData.status === 'PUBLIC' ? <EyeOff size={16} /> : <Eye size={16} />}
                                <span>
                                    {targetData.status === 'PUBLIC'
                                        ? t('levelDetail.makePrivate', 'Make Private')
                                        : t('levelDetail.makePublic', 'Make Public')}
                                </span>
                            </button>
                        )}

                        {}
                        {isModOrAdmin && (
                            <button
                                onClick={() => onAction('toggleStaffPick')}
                                className="btn-edit-profile"
                                style={actionButtonStyle}
                                onMouseEnter={(e) => hoverIn(e, 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)')}
                                onMouseLeave={(e) => hoverOut(e, actionButtonStyle)}
                            >
                                <Star size={16} />
                                <span>
                                    {targetData.staffPick
                                        ? t('levelDetail.removeStaffPick', 'Remove Staff Pick')
                                        : t('levelDetail.makeStaffPick', 'Make Staff Pick')}
                                </span>
                            </button>
                        )}

                        {}
                        {isModOrAdmin && (
                            <button
                                onClick={() => onAction('editConstant')}
                                className="btn-edit-profile"
                                style={actionButtonStyle}
                                onMouseEnter={(e) => hoverIn(e, 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)')}
                                onMouseLeave={(e) => hoverOut(e, actionButtonStyle)}
                            >
                                <Gauge size={16} />
                                <span>{t('levelDetail.editConstant', 'Edit Difficulty Constant')}</span>
                            </button>
                        )}

                        {}
                        {(currentUser.isAdmin || isOwner) && (
                            <button
                                onClick={() => onAction('deleteChart')}
                                className="btn-edit-profile"
                                style={dangerButtonStyle}
                                onMouseEnter={(e) => hoverIn(e, 'rgba(239, 68, 68, 0.2)')}
                                onMouseLeave={(e) => hoverOut(e, dangerButtonStyle)}
                            >
                                <Trash2 size={16} />
                                <span>{t('levelDetail.deleteChart', 'Delete Chart')}</span>
                            </button>
                        )}
                    </>
                )}

                {}
                {isUser && currentUser.isAdmin && (
                    <>
                        {}
                        {targetData.isBanned ? (
                            <button
                                onClick={() => onAction('unbanUser')}
                                className="btn-edit-profile"
                                style={successButtonStyle}
                                onMouseEnter={(e) => hoverIn(e, 'rgba(34, 197, 94, 0.2)')}
                                onMouseLeave={(e) => hoverOut(e, successButtonStyle)}
                            >
                                <ShieldCheck size={16} />
                                <span>{t('userProfile.unbanUser', 'Unban User')}</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => onAction('banUser')}
                                className="btn-edit-profile"
                                style={warningButtonStyle}
                                onMouseEnter={(e) => hoverIn(e, 'rgba(245, 158, 11, 0.2)')}
                                onMouseLeave={(e) => hoverOut(e, warningButtonStyle)}
                            >
                                <Ban size={16} />
                                <span>{t('userProfile.banUser', 'Ban User')}</span>
                            </button>
                        )}

                        {}
                        {targetData.isMod ? (
                            <button
                                onClick={() => onAction('unmod')}
                                className="btn-edit-profile"
                                style={warningButtonStyle}
                                onMouseEnter={(e) => hoverIn(e, 'rgba(245, 158, 11, 0.2)')}
                                onMouseLeave={(e) => hoverOut(e, warningButtonStyle)}
                            >
                                <ShieldOff size={16} />
                                <span>{t('userProfile.unmodUser', 'Remove Moderator')}</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => onAction('makeMod')}
                                className="btn-edit-profile"
                                style={successButtonStyle}
                                onMouseEnter={(e) => hoverIn(e, 'rgba(34, 197, 94, 0.2)')}
                                onMouseLeave={(e) => hoverOut(e, successButtonStyle)}
                            >
                                <ShieldCheck size={16} />
                                <span>{t('userProfile.makeMod', 'Make Moderator')}</span>
                            </button>
                        )}

                        {}
                        {targetData.isAdmin ? (
                            <button
                                onClick={() => onAction('unadmin')}
                                className="btn-edit-profile"
                                style={warningButtonStyle}
                                onMouseEnter={(e) => hoverIn(e, 'rgba(245, 158, 11, 0.2)')}
                                onMouseLeave={(e) => hoverOut(e, warningButtonStyle)}
                            >
                                <Crown size={16} />
                                <span>{t('userProfile.unadminUser', 'Remove Admin')}</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => onAction('makeAdmin')}
                                className="btn-edit-profile"
                                style={successButtonStyle}
                                onMouseEnter={(e) => hoverIn(e, 'rgba(34, 197, 94, 0.2)')}
                                onMouseLeave={(e) => hoverOut(e, successButtonStyle)}
                            >
                                <Crown size={16} />
                                <span>{t('userProfile.makeAdmin', 'Make Admin')}</span>
                            </button>
                        )}

                        {}
                        <button
                            onClick={() => onAction('deleteAccount')}
                            className="btn-edit-profile"
                            style={dangerButtonStyle}
                            onMouseEnter={(e) => hoverIn(e, 'rgba(239, 68, 68, 0.2)')}
                            onMouseLeave={(e) => hoverOut(e, dangerButtonStyle)}
                        >
                            <UserX size={16} />
                            <span>{t('userProfile.deleteAccountData', 'Delete Account Data')}</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
