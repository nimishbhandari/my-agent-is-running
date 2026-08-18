import { useRef } from "react";
import { resizeImageFile } from "./imageUtils.js";
import { galleryImages } from "./gallery.js";

function SettingsPanel({ settings, onUpdate, onReset, onClose }) {
  const fileInputRef = useRef(null);

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await resizeImageFile(file);
      onUpdate({ backgroundImage: dataUrl });
    } catch {
      // unreadable file; leave background as-is
    }
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <span>Customize</span>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <label>
        Title line 1
        <input value={settings.titleLine1} onChange={(e) => onUpdate({ titleLine1: e.target.value })} />
      </label>
      <label>
        Title line 2
        <input value={settings.titleLine2} onChange={(e) => onUpdate({ titleLine2: e.target.value })} />
      </label>
      <label>
        Subtitle
        <input value={settings.subtitle} onChange={(e) => onUpdate({ subtitle: e.target.value })} />
      </label>
      <label>
        Session label
        <input value={settings.sessionName} onChange={(e) => onUpdate({ sessionName: e.target.value })} />
      </label>

      <label className="accent-label">
        Accent
        <input type="color" value={settings.accent} onChange={(e) => onUpdate({ accent: e.target.value })} />
      </label>

      <div className="field-label">Colors</div>
      <div className="color-grid">
        <label className="color-field">
          <input type="color" value={settings.titleColor} onChange={(e) => onUpdate({ titleColor: e.target.value })} />
          Title
        </label>
        <label className="color-field">
          <input
            type="color"
            value={settings.subtitleColor}
            onChange={(e) => onUpdate({ subtitleColor: e.target.value })}
          />
          Subtitle
        </label>
        <label className="color-field">
          <input
            type="color"
            value={settings.sessionColor}
            onChange={(e) => onUpdate({ sessionColor: e.target.value })}
          />
          Session
        </label>
      </div>

      <div className="field-label">Background image</div>
      <div className="gallery">
        {galleryImages.map((img) => (
          <button
            key={img.id}
            type="button"
            className={`gallery-thumb ${settings.backgroundImage === img.url ? "selected" : ""}`}
            style={{ backgroundImage: `url(${img.url})` }}
            onClick={() => onUpdate({ backgroundImage: img.url })}
            aria-label={`Use background ${img.id}`}
          />
        ))}
      </div>

      <button type="button" className="text-btn full" onClick={() => fileInputRef.current?.click()}>
        {settings.backgroundImage ? "Change image" : "Upload your own"}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImage} />

      <div className="settings-actions">
        {settings.backgroundImage && (
          <button type="button" className="text-btn" onClick={() => onUpdate({ backgroundImage: null })}>
            Remove image
          </button>
        )}
        <button type="button" className="text-btn" onClick={onReset}>
          Reset all
        </button>
      </div>
    </div>
  );
}

export default SettingsPanel;
