"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2, Upload, X as XIcon, Image as ImageIcon, Music, FileText, Loader2, Play, Pause, Square, Calendar, CheckCircle as CheckCircleIcon, Globe, Link as LinkIcon, Lock, Clock } from "lucide-react";
import "./ChartModal.css";
import { useLanguage } from "../../contexts/LanguageContext";
import AudioControls from "../audio-control/AudioControls";
import AudioVisualizer from "../audio-visualizer/AudioVisualizer";
import LiquidSelect from "../liquid-select/LiquidSelect";
import { formatBytes } from "../../utils/byteUtils";
import FormattedText from "../formatted-text/FormattedText";
import EmojiSuggestion from "../emoji-suggestion/EmojiSuggestion";


const validateLevelValue = (val) => {
  if (val === '' || val === '-') return val;
  const num = parseInt(val, 10);
  if (isNaN(num)) return '';
  return Math.max(-999, Math.min(999, num)).toString();
};

const ModalInput = ({ id, label, value, onChange, maxLength, placeholder, required = false, type = "text", inputMode, min = undefined, max = undefined, ...props }) => (
  <div className="form-group">
    <div className="label-row">
      <label htmlFor={id}>{label}</label>
      {maxLength && (
        <span className={`char - count ${value?.length >= maxLength ? 'limit-reached' : ''} `}>
          {value?.length || 0}/{maxLength}
        </span>
      )}
    </div>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      placeholder={placeholder}
      required={required}
      inputMode={inputMode}
      min={min}
      max={max}
      {...props}
    />
  </div>
);

const ModalTextarea = ({ id, label, value, onChange, maxLength, placeholder }) => (
  <div className="form-group">
    <div className="label-row">
      <label htmlFor={id}>{label}</label>
      {maxLength && (
        <span className={`char - count ${value?.length >= maxLength ? 'limit-reached' : ''} `}>
          {value?.length || 0}/{maxLength}
        </span>
      )}
    </div>
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      rows="12"
      maxLength={maxLength}
      placeholder={placeholder}
      style={{ minHeight: '220px', resize: 'vertical' }}
    />
  </div>
);

const FilePreview = ({ file, type }) => {
  const [url, setUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
      
      setIsPlaying(false);
    };
  }, [file]);

  if (!url) return null;

  if (type === 'image') {
    return (
      <div className="preview-container">
        <img src={url} alt="Preview" className="preview-image" style={{ marginTop: '8px', maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <div className="audio-preview-container" style={{ width: '100%', marginTop: '8px' }}>
        <AudioControls
          bgmUrl={url}
          onPlay={() => setIsPlaying(true)}
          onStop={() => setIsPlaying(false)}
          isPlaying={isPlaying}
          isActive={isPlaying}
          audioRef={(ref) => { audioRef.current = ref; }}
        />
        {isPlaying && audioRef.current && (
          <AudioVisualizer
            audioRef={audioRef.current}
            isPlaying={isPlaying}
          />
        )}
      </div>
    );
  }
  return null;
};

export default function ChartModal({
  isOpen,
  mode,
  form,
  onClose,
  onSubmit,
  onUpdate,
  loading = false,
  editData = null,
  limits = null
}) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const checkFileLimit = (limit, callback) => (e) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].size > limit) {
        alert(t('modal.fileTooLarge', `File size exceeds the limit of ${formatBytes(limit)}`));
        e.target.value = "";
        return;
      }
      callback(e);
    }
  };

  const visibilityOptions = [
    { value: "public", label: t('dashboard.public'), icon: Globe },
    { value: "unlisted", label: t('dashboard.unlisted'), icon: LinkIcon },
    { value: "private", label: t('dashboard.private'), icon: Lock }
  ];

  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const audioRefs = useRef({});

  
  const descriptionEditRef = useRef(null);
  const descriptionUpRef = useRef(null);
  const [emojiOpenEdit, setEmojiOpenEdit] = useState(false);
  const [emojiOpenUp, setEmojiOpenUp] = useState(false);

  const handlePlay = (id) => {
    Object.keys(audioRefs.current).forEach(key => {
      if (key !== id && audioRefs.current[key]) {
        audioRefs.current[key].pause();
        audioRefs.current[key].currentTime = 0;
      }
    });

    if (audioRefs.current[id]) {
      audioRefs.current[id].play();
      setCurrentlyPlaying(id);
    }
  };

  const handleStop = (id) => {
    if (audioRefs.current[id]) {
      audioRefs.current[id].pause();
      audioRefs.current[id].currentTime = 0;
    }
    if (currentlyPlaying === id) {
      setCurrentlyPlaying(null);
    }
  };

  const handleAudioRef = (id, ref) => {
    audioRefs.current[id] = ref;
  };

  if (!isOpen || !mounted) return null;
 //Loading Overlay, will make this work eventually...
  if (loading) {
    return createPortal(
      <div className="modal-overlay">
        <div className="edit-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '260px' }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-uploading-inner">
            <div className="modal-uploading-spinner" />
            <span className="modal-uploading-text">
              {mode === 'upload'
                ? t('modal.uploading', 'Uploading...')
                : t('modal.saving', 'Saving...')}
            </span>
            <span className="modal-uploading-sub">
              {t('modal.uploadingHint', 'Please wait, do not close this window')}
            </span>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-container" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <strong>{mode === 'upload' ? t('modal.upload', 'Upload Chart') : t('modal.edit', 'Edit Chart')}</strong>
          <button className="close-btn" onClick={onClose}>
            <XIcon size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="meta-form" hidden={mode !== "edit"}>
            <form onSubmit={handleSubmit}>
              <ModalInput id="title_edit" label={`${t('modal.songTitle', 'Song Title')} * `} value={form.title} onChange={onUpdate("title")} maxLength={limits?.text?.title || 50} placeholder={t('modal.placeholderTitle')} required />
              <ModalInput id="artists_edit" label={`${t('modal.artists', 'Artist(s)')} * `} value={form.artists} onChange={onUpdate("artists")} maxLength={limits?.text?.artist || 50} placeholder={t('modal.placeholderArtist')} required />
              <ModalInput id="author_edit" label={`${t('modal.charter', 'Charter Name')} * `} value={form.author} onChange={onUpdate("author")} maxLength={limits?.text?.author || 50} placeholder={t('modal.placeholderCharter')} required />

              <ModalInput
                id="rating_edit"
                label={`${t('modal.level', 'Level')} * `}
                value={form.rating}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val.length > 3) val = val.slice(0, 3);
                  onUpdate("rating")(val)
                }}
                placeholder={t('modal.placeholderLevel')}
                required type="number"
                inputMode="numeric"
                onWheel={(e) => e.target.blur()}
              />

              <div className="relative">
                <ModalTextarea
                  id="description_edit"
                  label={t('modal.description', 'Description (Optional)')}
                  value={form.description}
                  onChange={onUpdate("description")}
                  maxLength={limits?.text?.description || 1000}
                  placeholder={t('modal.placeholderDescription')}
                  ref={descriptionEditRef}
                />
                <EmojiSuggestion
                  value={form.description}
                  textareaRef={descriptionEditRef}
                  onSelect={(newVal) => onUpdate("description")(newVal)}
                  isOpen={emojiOpenEdit}
                  setIsOpen={setEmojiOpenEdit}
                />
              </div>

              <ModalInput id="tags_edit" label={t('modal.tags', 'Tags')} value={form.tags} onChange={onUpdate("tags")} placeholder={t('modal.placeholderTags')} />

              <div className="form-group">
                <label htmlFor="visibility_edit">{t('modal.visibility', 'Visibility')}</label>
                <div className="flex flex-col gap-2">
                  <LiquidSelect
                    value={form.visibility || "public"}
                    onChange={(e) => onUpdate("visibility")(e)}
                    options={visibilityOptions}
                  />
                </div>
              </div>





              <div className="form-group file-section">
                <label htmlFor="jacket_edit">{t('modal.coverImage', 'Cover Image')} (.png/.jpg, max {limits?.files?.jacket ? formatBytes(limits.files.jacket) : '5MB'})</label>
                <div className="flex gap-1">
                  <input
                    id="jacket_edit"
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={checkFileLimit(limits?.files?.jacket || 5 * 1024 * 1024, (e) => {
                      onUpdate("jacket")(e);
                      onUpdate("removeJacket")(false);
                    })}
                  />
                  {!form.jacket && editData && editData.jacketUrl && !form.removeJacket && (
                    <div
                      className="aspect-square h-24 border-2 flex items-center justify-center p-3 rounded-xl border-dashed gap-1 text-sm font-bold cursor-pointer transition-all border-red-300/30 bg-red-200/10 hover:border-red-100/80 hover:bg-red-200/15"
                      onClick={() => onUpdate("removeJacket")(true)}
                    >
                      <XIcon className="size-4" />
                      {t('modal.removeExisting')}
                    </div>
                  )}
                  {form.removeJacket && (
                    <div className="text-red-500 font-bold text-sm my-2 flex items-center gap-2">
                      <XIcon size={14} /> {t('modal.existingRemoved', { 1: t('modal.coverImage').toLowerCase() })}
                      <button type="button" onClick={() => onUpdate("removeJacket")(false)} className="text-blue-500 underline text-xs">{t('common.undo')}</button>
                    </div>
                  )}
                </div>
                {form.jacket && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { 1: form.jacket.name })}</span>
                      <button type="button" onClick={() => onUpdate("jacket")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                    <FilePreview file={form.jacket} type="image" />
                  </div>
                )}
                {editData && editData.jacketUrl && !form.jacket && !form.removeJacket && (
                  <div className="file-preview">
                    <div className="file-info-row">
                      <span>{t('modal.current', { 1: editData.jacketUrl.split('/').pop() })}</span>
                    </div>
                    <img src={editData.jacketUrl} alt="Current jacket" />
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="bgm_edit">{t('modal.audio', 'Audio')} (max {limits?.files?.audio ? formatBytes(limits.files.audio) : '50 MB'})</label>
                <div className="flex gap-1">
                  <input
                    id="bgm_edit"
                    type="file"
                    accept="audio/mp3, audio/mpeg"
                    onChange={checkFileLimit(limits?.files?.audio || 20 * 1024 * 1024, (e) => {
                      onUpdate("bgm")(e);
                      onUpdate("removeAudio")(false);
                    })}
                  />
                  {!form.bgm && editData && editData.bgmUrl && !form.removeAudio && (
                    <div
                      className="aspect-square h-24 border-2 flex items-center justify-center p-3 rounded-xl border-dashed gap-1 text-sm font-bold cursor-pointer transition-all border-red-300/30 bg-red-200/10 hover:border-red-100/80 hover:bg-red-200/15"
                      onClick={() => onUpdate("removeAudio")(true)}
                    >
                      <XIcon className="size-4" />
                      {t('modal.removeExisting')}
                    </div>
                  )}
                  {form.removeAudio && (
                    <div className="text-red-500 font-bold text-sm my-2 flex items-center gap-2">
                      <XIcon size={14} /> {t('modal.existingRemoved', { 1: t('modal.audio').toLowerCase() })}
                      <button type="button" onClick={() => onUpdate("removeAudio")(false)} className="text-blue-500 underline text-xs">{t('common.undo')}</button>
                    </div>
                  )}
                </div>
                {form.bgm && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { 1: form.bgm.name })}</span>
                      <button type="button" onClick={() => onUpdate("bgm")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                    <FilePreview file={form.bgm} type="audio" />
                  </div>
                )}
                {editData && editData.bgmUrl && !form.bgm && !form.removeAudio && (
                  <div className="file-preview">
                    <div className="file-info-row">
                      <span>{t('modal.current', { 1: editData.bgmUrl.split('/').pop() })}</span>
                    </div>
                    <div className="audio-preview-container">
                      <AudioControls
                        bgmUrl={editData.bgmUrl}
                        onPlay={() => handlePlay('edit-bgm')}
                        onStop={() => handleStop('edit-bgm')}
                        isPlaying={currentlyPlaying === 'edit-bgm'}
                        isActive={currentlyPlaying === 'edit-bgm'}
                        audioRef={(ref) => handleAudioRef('edit-bgm', ref)}
                      />
                      {currentlyPlaying === 'edit-bgm' && (
                        <AudioVisualizer
                          audioRef={audioRefs.current['edit-bgm']}
                          isPlaying={currentlyPlaying === 'edit-bgm'}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="chart_edit">{t('modal.chartFile', 'Chart File')} (max {limits?.files?.chart ? formatBytes(limits.files.chart) : '10MB'})</label>
                <div className="flex gap-1 flex-col">
                  {(!editData?.chartUrl || form.removeChart) && (
                    <input
                      id="chart_edit"
                      type="file"
                      onChange={checkFileLimit(limits?.files?.chart || 10 * 1024 * 1024, (e) => {
                        onUpdate("chart")(e);
                        onUpdate("removeChart")(false);
                      })}
                    />
                  )}
                  {!form.chart && editData && editData.chartUrl && !form.removeChart && (
                    <div
                      className="aspect-square h-24 border-2 flex items-center justify-center p-3 rounded-xl border-dashed gap-1 text-sm font-bold cursor-pointer transition-all border-red-300/30 bg-red-200/10 hover:border-red-100/80 hover:bg-red-200/15"
                      onClick={() => onUpdate("removeChart")(true)}
                    >
                      <XIcon className="size-4" />
                      {t('modal.removeExistingReplace')}
                    </div>
                  )}
                  {form.removeChart && (
                    <div className="text-red-500 font-bold text-sm my-2 flex items-center gap-2">
                      <XIcon size={14} /> {t('modal.existingRemoved', { 1: t('modal.chartFile').toLowerCase() })}
                      <button type="button" onClick={() => onUpdate("removeChart")(false)} className="text-blue-500 underline text-xs">{t('common.undo')}</button>
                    </div>
                  )}
                </div>
                {form.chart && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { 1: form.chart.name })}</span>
                      <button type="button" onClick={() => onUpdate("chart")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                  </div>
                )}
                {editData && editData.chartUrl && !form.chart && !form.removeChart && (
                  <div className="file-preview">
                    <div className="file-info-row">
                      <span>{t('modal.current', { 1: t('modal.chartFile') })}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="preview_edit">{t('modal.previewAudio', 'Preview Audio (Optional)')} (max {limits?.files?.preview ? formatBytes(limits.files.preview) : '50 MB'})</label>
                <div className="flex gap-1">
                  <input
                    id="preview_edit"
                    type="file"
                    accept="audio/mp3, audio/mpeg"
                    onChange={checkFileLimit(limits?.files?.preview || 20 * 1024 * 1024, (e) => {
                      onUpdate("preview")(e)
                      onUpdate("removePreview")(false)
                    })}
                  />
                  {!form.preview && editData && editData.previewUrl && !form.removePreview && (
                    <div
                      className="aspect-square h-24 border-2 flex items-center justify-center p-3 rounded-xl border-dashed gap-1 text-sm font-bold cursor-pointer transition-all border-red-300/30 bg-red-200/10 hover:border-red-100/80 hover:bg-red-200/15"
                      onClick={() => {
                        onUpdate("removePreview")(true)
                      }}
                    >
                      <XIcon className="size-4" />
                      {t('modal.removeExisting')}
                    </div>
                  )}
                  {form.removePreview && (
                    <div className="text-red-500 font-bold text-sm my-2 flex items-center gap-2">
                      <XIcon size={14} /> {t('modal.existingRemoved', { 1: t('modal.previewAudio').toLowerCase() })}
                      <button type="button" onClick={() => onUpdate("removePreview")(false)} className="text-blue-500 underline text-xs">{t('common.undo')}</button>
                    </div>
                  )}
                </div>
                {form.preview && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { 1: form.preview.name })}</span>
                      <button type="button" onClick={() => onUpdate("preview")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                    <FilePreview file={form.preview} type="audio" />
                  </div>
                )}
                {editData && editData.previewUrl && !form.preview && !form.removePreview && (
                  <div className="file-preview">
                    <span>{t('modal.current', { 1: editData.previewUrl.split('/').pop() })}</span>
                    <div className="audio-preview-container">
                      <AudioControls
                        bgmUrl={editData.previewUrl}
                        onPlay={() => handlePlay('edit-preview')}
                        onStop={() => handleStop('edit-preview')}
                        isPlaying={currentlyPlaying === 'edit-preview'}
                        isActive={currentlyPlaying === 'edit-preview'}
                        audioRef={(ref) => handleAudioRef('edit-preview', ref)}
                      />
                      {currentlyPlaying === 'edit-preview' && (
                        <AudioVisualizer
                          audioRef={audioRefs.current['edit-preview']}
                          isPlaying={currentlyPlaying === 'edit-preview'}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="background_edit">{t('modal.backgroundImage', 'Background Image (Optional)')} (max {limits?.files?.background ? formatBytes(limits.files.background) : '50 MB'})</label>
                <div className="flex gap-1">
                  <input
                    id="background_edit"
                    type="file"
                    accept="image/png"
                    onChange={checkFileLimit(limits?.files?.background || 5 * 1024 * 1024, (e) => {
                      onUpdate("background")(e)
                      onUpdate("removeBackground")(false)
                    })}
                  />
                  {!form.background && editData && editData.backgroundUrl && !form.removeBackground && (
                    <div
                      className="aspect-square h-24 border-2 flex items-center justify-center p-3 rounded-xl border-dashed gap-1 text-sm font-bold cursor-pointer transition-all border-red-300/30 bg-red-200/10 hover:border-red-100/80 hover:bg-red-200/15"
                      onClick={() => {
                        onUpdate("removeBackground")(true)
                      }}
                    >
                      <XIcon className="size-4" />
                      {t('modal.removeExisting')}
                    </div>
                  )}
                  {form.removeBackground && (
                    <div className="text-red-500 font-bold text-sm my-2 flex items-center gap-2">
                      <XIcon size={14} /> {t('modal.existingRemoved', { 1: t('modal.backgroundImage').toLowerCase() })}
                      <button type="button" onClick={() => onUpdate("removeBackground")(false)} className="text-blue-500 underline text-xs">{t('common.undo')}</button>
                    </div>
                  )}
                </div>
                {form.background && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { 1: form.background.name })}</span>
                      <button type="button" onClick={() => onUpdate("background")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                    <FilePreview file={form.background} type="image" />
                  </div>
                )}
                {editData && editData.backgroundUrl && !form.background && !form.removeBackground && (
                  <div className="file-preview">
                    <img src={editData.backgroundUrl} alt="Current Background" />
                  </div>
                )}
              </div>

              <button className="edit-save-btn" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t('modal.saving', 'Saving...')}
                  </>
                ) : t('modal.saveChanges', 'Save Changes')}
              </button>
            </form >
          </div >

          {}
          < div className="upload-form" hidden={mode !== "upload"
          }>
            {}
            < div className="modal-reminders" >
              <h4>{t('modal.remindersTitle', '⚠️ Read before uploading:')}</h4>
              <ul className="rules-list text-sm opacity-90 space-y-1">
                <li>1. {t('uploadPolicy.rule1')}</li>
                <li>2. {t('uploadPolicy.rule2')}</li>
                <li>3. {t('uploadPolicy.rule3')}</li>
                <li>4. {t('uploadPolicy.rule4')}</li>
                <li>5. {t('uploadPolicy.rule5')}</li>
                <li>6. {t('uploadPolicy.rule6')}</li>
                <li>7. {t('uploadPolicy.rule7')}</li>
                <li>8. {t('uploadPolicy.rule8')}</li>
              </ul>
              <div className="mt-2 text-xs opacity-75 flex items-center gap-1">
                <CheckCircleIcon size={12} />
                <span dangerouslySetInnerHTML={{ __html: t('uploadPolicy.relaxedNote') }} />
              </div>
            </div >
            <form onSubmit={handleSubmit}>
              <ModalInput id="title_up" label={`${t('modal.songTitle', 'Song Title')} * `} value={form.title} onChange={onUpdate("title")} maxLength={limits?.text?.title || 50} placeholder={t('modal.placeholderTitle')} required />
              <ModalInput id="artists_up" label={`${t('modal.artists', 'Artist(s)')} * `} value={form.artists} onChange={onUpdate("artists")} maxLength={limits?.text?.artist || 50} placeholder={t('modal.placeholderArtist')} required />
              <div className="preview-text text-sm text-gray-400 mt-1">
                {t('common.preview')} <FormattedText text={form.artists || t('modal.artistPreview')} />
              </div>
              <div className="form-group">
                <ModalInput id="author_up" label={`${t('modal.charter', 'Charter Name')} * `} value={form.author} onChange={onUpdate("author")} maxLength={limits?.text?.author || 50} placeholder={t('modal.placeholderCharter')} required />
                <div className="preview-text text-sm text-gray-400 mt-1">
                  {t('common.preview')} <FormattedText text={form.author || t('modal.charterPreview')} />
                </div>
              </div>

              <ModalInput
                id="rating_up"
                label={`${t('modal.level', 'Level')} * `}
                value={form.rating}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val.length > 3) val = val.slice(0, 3);
                  onUpdate("rating")(val)
                }}
                placeholder={t('modal.placeholderLevel')}
                required type="number"
                inputMode="numeric"
                onWheel={(e) => e.target.blur()}
              />

              <div className="relative">
                <ModalTextarea
                  id="description_up"
                  label={t('modal.description', 'Description (Optional)')}
                  value={form.description}
                  onChange={onUpdate("description")}
                  maxLength={limits?.text?.description || 1000}
                  placeholder={t('modal.placeholderDescription')}
                  ref={descriptionUpRef}
                />
                <EmojiSuggestion
                  value={form.description}
                  textareaRef={descriptionUpRef}
                  onSelect={(newVal) => onUpdate("description")(newVal)}
                  isOpen={emojiOpenUp}
                  setIsOpen={setEmojiOpenUp}
                />
              </div>

              <ModalInput id="tags_up" label={t('modal.tags', 'Tags')} value={form.tags} onChange={onUpdate("tags")} placeholder={t('modal.placeholderTags')} />

              <div className="form-group">
                <label htmlFor="visibility_up">{t('modal.visibility', 'Visibility')} *</label>
                <LiquidSelect
                  value={form.visibility || "public"}
                  onChange={(e) => onUpdate("visibility")(e)}
                  options={visibilityOptions}
                />
              </div>

              <div className="form-group file-section">
                <label htmlFor="jacket_up">{t('modal.coverImage', 'Cover Image')} (.png/.jpg, max {limits?.files?.jacket ? formatBytes(limits.files.jacket) : '5MB'}) *</label>
                <input
                  id="jacket_up"
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={checkFileLimit(limits?.files?.jacket || 5 * 1024 * 1024, onUpdate("jacket"))}
                  required
                />
                {form.jacket && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { 1: form.jacket.name })}</span>
                      <button type="button" onClick={() => onUpdate("jacket")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                    <FilePreview file={form.jacket} type="image" />
                  </div>
                )}
              </div>



              <div className="form-group file-section">
                <label htmlFor="bgm_up">{t('modal.audio', 'Audio')} (.mp3, max {limits?.files?.audio ? formatBytes(limits.files.audio) : '20MB'}) *</label>
                <input
                  id="bgm_up"
                  type="file"
                  accept="audio/mp3, audio/mpeg"
                  onChange={checkFileLimit(limits?.files?.audio || 20 * 1024 * 1024, onUpdate("bgm"))}
                  required
                />
                {form.bgm && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { 1: form.bgm.name })}</span>
                      <button type="button" onClick={() => onUpdate("bgm")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                    <FilePreview file={form.bgm} type="audio" />
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="chart_up">{t('modal.chartFile', 'Chart File')} (max {limits?.files?.chart ? formatBytes(limits.files.chart) : '10MB'}) *</label>
                <input
                  id="chart_up"
                  type="file"
                  onChange={checkFileLimit(limits?.files?.chart || 10 * 1024 * 1024, onUpdate("chart"))}
                  required
                />
                {form.chart && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { 1: form.chart.name })}</span>
                      <button type="button" onClick={() => onUpdate("chart")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="preview_up">{t('modal.previewAudio', 'Preview Audio (Optional)')} (max {limits?.files?.preview ? formatBytes(limits.files.preview) : '50 MB'})</label>
                <input
                  id="preview_up"
                  type="file"
                  accept="audio/mp3, audio/mpeg"
                  onChange={checkFileLimit(limits?.files?.preview || 20 * 1024 * 1024, onUpdate("preview"))}
                />
                {form.preview && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { 1: form.preview.name })}</span>
                      <button type="button" onClick={() => onUpdate("preview")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                    <FilePreview file={form.preview} type="audio" />
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="background_up">{t('modal.backgroundImage', 'Background Image (Optional)')} (max {limits?.files?.background ? formatBytes(limits.files.background) : '50 MB'})</label>
                <input
                  id="background_up"
                  type="file"
                  accept="image/png"
                  onChange={checkFileLimit(limits?.files?.background || 5 * 1024 * 1024, onUpdate("background"))}
                />
                {form.background && (
                  <div className="file-preview selected">
                    <div className="file-info-row">
                      <span>{t('modal.selected', { 1: form.background.name })}</span>
                      <button type="button" onClick={() => onUpdate("background")(null)} className="remove-preview-btn">
                        <XIcon size={14} /> {t('modal.remove', 'Remove')}
                      </button>
                    </div>
                    <FilePreview file={form.background} type="image" />
                  </div>
                )}
              </div>

              <button
                className="upload-save-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t('modal.uploading', 'Uploading...')}
                  </>
                ) : (
                  t('modal.upload', 'Upload Chart')
                )}
              </button>
            </form>
          </div >
        </div >
      </div >
    </div >,
    document.body
  );
}
