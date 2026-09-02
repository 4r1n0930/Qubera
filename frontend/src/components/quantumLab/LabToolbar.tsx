import {
  Play,
  Plus,
  Minus,
  RotateCcw,
  RotateCw,
  Loader2,
  Trash2,
  LayoutPanelTop,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'
import type { BackendType, PresetCircuit } from '../../types/quantumLab'
import { PRESET_CIRCUITS } from '../../types/quantumLab'
import { FrameworkSelector } from './CodeEditor/FrameworkSelector'
import type { LayoutPreset } from './layoutPresets'
import { LAYOUT_PRESETS } from './layoutPresets'

interface LabToolbarProps {
  numQubits: number
  onAddQubit: () => void
  onRemoveQubit: () => void
  onClear: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onLoadPreset: (preset: PresetCircuit) => void
  backend: BackendType
  onBackendChange: (b: BackendType) => void
  shots: number
  onShotsChange: (s: number) => void
  onRun: () => void
  isRunning: boolean
  layoutPreset: LayoutPreset
  onLayoutPresetChange: (p: LayoutPreset) => void
}

export function LabToolbar({
  numQubits,
  onAddQubit,
  onRemoveQubit,
  onClear,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onLoadPreset,
  backend,
  onBackendChange,
  shots,
  onShotsChange,
  onRun,
  isRunning,
  layoutPreset,
  onLayoutPresetChange,
}: LabToolbarProps) {
  const [presetSelectOpen, setPresetSelectOpen] = useState(false)
  const [layoutOpen, setLayoutOpen] = useState(false)

  return (
    <div className="qlab-toolbar">
      {/* Left: Brand + circuit controls */}
      <div className="qlab-toolbar-left">
        <div className="qlab-title-group">
          <span className="qlab-overline">QUBERA</span>
          <h1 className="qlab-title">Quantum Lab</h1>
        </div>

        <div className="qlab-toolbar-divider" />

        <div className="qlab-toolbar-actions">
          <div className="qlab-qubit-stepper">
            <button
              type="button"
              className="qlab-btn-compact qlab-btn-icon"
              onClick={onRemoveQubit}
              disabled={numQubits <= 1}
              title="Remove wire (minimum 1)"
              aria-label="Remove qubit wire"
            >
              <Minus size={14} />
            </button>
            <span className="qlab-qubit-count">
              {numQubits} Qubit{numQubits > 1 ? 's' : ''}
            </span>
            <button
              type="button"
              className="qlab-btn-compact qlab-btn-icon"
              onClick={onAddQubit}
              disabled={numQubits >= 6}
              title="Add wire (maximum 6)"
              aria-label="Add qubit wire"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            type="button"
            className="qlab-btn-compact"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo circuit modification"
          >
            <RotateCcw size={14} />
            <span className="hidden md:inline">Undo</span>
          </button>

          <button
            type="button"
            className="qlab-btn-compact"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            aria-label="Redo circuit modification"
          >
            <RotateCw size={14} />
            <span className="hidden md:inline">Redo</span>
          </button>
        </div>

        <div className="qlab-toolbar-divider" />

        {/* Presets */}
        <div className="qlab-toolbar-actions">
          <div className="qlab-dropdown">
            <button
              type="button"
              className="qlab-btn-compact"
              onClick={() => setPresetSelectOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={presetSelectOpen}
            >
              Presets
              <ChevronDown size={13} />
            </button>
            {presetSelectOpen && (
              <div className="qlab-dropdown-menu" role="listbox">
                {PRESET_CIRCUITS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="qlab-dropdown-item"
                    onClick={() => {
                      onLoadPreset(p)
                      setPresetSelectOpen(false)
                    }}
                  >
                    <span className="qlab-dropdown-item-name">{p.name}</span>
                    <span className="qlab-dropdown-item-desc">{p.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="qlab-btn-compact qlab-btn-danger-outline"
            onClick={onClear}
            title="Clear all gates"
            aria-label="Clear all gates in circuit"
          >
            <Trash2 size={14} />
            <span className="hidden md:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Right: execution settings + layout + run */}
      <div className="qlab-toolbar-right">
        <FrameworkSelector value={backend} onChange={onBackendChange} label="Backend" />

        <div className="qlab-select-group">
          <label htmlFor="shots-select" className="qlab-select-label">
            Shots
          </label>
          <select
            id="shots-select"
            className="qlab-select qlab-select-compact"
            value={shots}
            onChange={(e) => onShotsChange(Number(e.target.value))}
          >
            <option value={100}>100</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
            <option value={2048}>2048</option>
            <option value={4096}>4096</option>
          </select>
        </div>

        {/* Layout preset dropdown */}
        <div className="qlab-dropdown">
          <button
            type="button"
            className="qlab-btn-compact"
            onClick={() => setLayoutOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={layoutOpen}
          >
            <LayoutPanelTop size={14} />
            <span>Layout</span>
            <ChevronDown size={13} />
          </button>
          {layoutOpen && (
            <div className="qlab-dropdown-menu qlab-dropdown-menu-right" role="listbox">
              {Object.entries(LAYOUT_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  className={`qlab-dropdown-item ${layoutPreset === key ? 'is-active' : ''}`}
                  onClick={() => {
                    onLayoutPresetChange(key as LayoutPreset)
                    setLayoutOpen(false)
                  }}
                  role="option"
                  aria-selected={layoutPreset === key}
                >
                  <span className="qlab-dropdown-item-name">{preset.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="qlab-run-btn"
          onClick={onRun}
          disabled={isRunning}
          aria-label="Run circuit on selected quantum backend"
        >
          {isRunning ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play size={16} fill="currentColor" />
              <span>Run</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}