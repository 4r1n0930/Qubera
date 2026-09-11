import { useCallback, useEffect, useState } from 'react'
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  LogOut,
  Check,
  AlertTriangle,
  Save,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readUser() {
  try {
    const raw = localStorage.getItem('qubera_user')
    if (!raw) return null
    return JSON.parse(raw) as { name: string; email: string }
  } catch {
    return null
  }
}

const SETTINGS_KEY = 'qubera_settings'

interface SettingsState {
  displayName: string
  email: string
  dailyGoal: string
  theme: string
  language: string
  notifyWeekly: boolean
  notifyChallenges: boolean
  notifyStreaks: boolean
  notifyUpdates: boolean
  publicProfile: boolean
  showOnLeaderboard: boolean
  shareProgress: boolean
}

const defaults: SettingsState = {
  displayName: '',
  email: '',
  dailyGoal: '30',
  theme: 'system',
  language: 'en',
  notifyWeekly: true,
  notifyChallenges: true,
  notifyStreaks: false,
  notifyUpdates: false,
  publicProfile: true,
  showOnLeaderboard: true,
  shareProgress: false,
}

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    const user = readUser()
    const stored = raw ? JSON.parse(raw) : {}
    return {
      ...defaults,
      ...stored,
      displayName: user?.name ?? defaults.displayName,
      email: user?.email ?? defaults.email,
    }
  } catch {
    const user = readUser()
    return {
      ...defaults,
      displayName: user?.name ?? defaults.displayName,
      email: user?.email ?? defaults.email,
    }
  }
}

// ---------------------------------------------------------------------------
// Toggle component
// ---------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? '#2f6b57' : '#c7c8c3',
        position: 'relative',
        transition: 'background 180ms ease',
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          transition: 'left 180ms ease',
        }}
        aria-hidden="true"
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Section component
// ---------------------------------------------------------------------------

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof Settings
  children: React.ReactNode
}) {
  return (
    <section className="dash-card" style={{ padding: '18px 18px 16px' }}>
      <div
        className="dash-card-title"
        style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f1ef' }}
      >
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: 'var(--color-sage-faint)',
              border: '1px solid #d8e4da',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-sage-dark)',
              flexShrink: 0,
            }}
          >
            <Icon size={15} />
          </span>
          {title}
        </h3>
      </div>
      {children}
    </section>
  )
}

function FormRow({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        padding: '10px 0',
        borderBottom: '1px solid #f6f7f5',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ink)' }}>{label}</div>
        {hint && <div style={{ fontSize: '0.76rem', color: 'var(--color-inkmuted)', marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

function TextInput({
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: 220,
        maxWidth: 100 + '%',
        padding: '9px 12px',
        borderRadius: 10,
        border: '1px solid var(--color-cardborder)',
        background: '#fff',
        color: 'var(--color-ink)',
        fontSize: '0.88rem',
        outline: 'none',
        transition: 'border-color 180ms ease',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-sage)'
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-cardborder)'
      }}
    />
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: 180,
        padding: '9px 12px',
        borderRadius: 10,
        border: '1px solid var(--color-cardborder)',
        background: '#fff',
        color: 'var(--color-ink)',
        fontSize: '0.88rem',
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(loadSettings)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const { logout } = useAuth()

  const set = useCallback(
    <K extends keyof SettingsState>(key: K, val: SettingsState[K]) =>
      setSettings((s) => ({ ...s, [key]: val })),
    []
  )

  // Reset save status on change
  useEffect(() => {
    if (saveStatus === 'saved') setSaveStatus('idle')
  }, [settings, saveStatus])

  const handleSave = useCallback(() => {
    setSaveStatus('saving')
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch { /* */ }
    window.setTimeout(() => setSaveStatus('saved'), 300)
  }, [settings])

  const handleSignOut = useCallback(() => {
    logout()
  }, [logout])

  return (
    <div className="dash-page" style={{ display: 'grid', gap: 18, maxWidth: 780 }}>
      {/* Page header */}
      <div style={{ paddingTop: 4 }}>
        <h1
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--color-ink)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          Settings
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'var(--color-sage-faint)',
              border: '1px solid #d8e4da',
              color: 'var(--color-sage-dark)',
            }}
            aria-hidden="true"
          >
            <Settings size={16} />
          </span>
        </h1>
        <p style={{ marginTop: 6, color: 'var(--color-inkmuted)', fontSize: '0.88rem', maxWidth: 420 }}>
          Manage your account, notifications, privacy and learning preferences.
        </p>
      </div>

      {/* Save banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 14,
          background: saveStatus === 'saved' ? 'var(--color-success-soft)' : 'var(--color-sage-faint)',
          border: `1px solid ${saveStatus === 'saved' ? '#b8e0c8' : '#d8e4da'}`,
        }}
      >
        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {saveStatus === 'saved' ? (
            <>
              <Check size={16} color="#2f7d5b" /> Changes saved successfully.
            </>
          ) : (
            'Unsaved changes'
          )}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #2f6b57, #0b3d32)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            opacity: saveStatus === 'saving' ? 0.7 : 1,
          }}
        >
          <Save size={15} />
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : 'Save Changes'}
        </button>
      </div>

      {/* Account */}
      <SectionCard title="Account" icon={User}>
        <FormRow label="Display Name" hint="Shown on your public profile and leaderboard">
          <TextInput value={settings.displayName} onChange={(v) => set('displayName', v)} placeholder="Your name" />
        </FormRow>
        <FormRow label="Email" hint="Used for sign-in and notifications">
          <TextInput
            type="email"
            value={settings.email}
            onChange={(v) => set('email', v)}
            placeholder="you@example.com"
          />
        </FormRow>
      </SectionCard>

      {/* Preferences */}
      <SectionCard title="Preferences" icon={Palette}>
        <FormRow label="Theme" hint="Switch between light, dark and system mode">
          <Select
            value={settings.theme}
            onChange={(v) => set('theme', v)}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </FormRow>
        <FormRow label="Language" hint="Interface language and lesson content locale">
          <Select
            value={settings.language}
            onChange={(v) => set('language', v)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'hi', label: 'Hindi' },
              { value: 'es', label: 'Español' },
              { value: 'ja', label: '日本語' },
            ]}
          />
        </FormRow>
        <FormRow label="Daily Learning Goal" hint="Minutes per day you aim to study">
          <Select
            value={settings.dailyGoal}
            onChange={(v) => set('dailyGoal', v)}
            options={[
              { value: '15', label: '15 minutes' },
              { value: '30', label: '30 minutes' },
              { value: '45', label: '45 minutes' },
              { value: '60', label: '60 minutes' },
            ]}
          />
        </FormRow>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notifications" icon={Bell}>
        <FormRow label="Weekly Digest" hint="Summary of your learning activity every Monday">
          <Toggle checked={settings.notifyWeekly} onChange={(v) => set('notifyWeekly', v)} />
        </FormRow>
        <FormRow label="Challenge Alerts" hint="Notifications for new daily and weekly challenges">
          <Toggle checked={settings.notifyChallenges} onChange={(v) => set('notifyChallenges', v)} />
        </FormRow>
        <FormRow label="Streak Reminders" hint="Reminders when your streak is at risk">
          <Toggle checked={settings.notifyStreaks} onChange={(v) => set('notifyStreaks', v)} />
        </FormRow>
        <FormRow label="Product Updates" hint="Announcements about new features and improvements">
          <Toggle checked={settings.notifyUpdates} onChange={(v) => set('notifyUpdates', v)} />
        </FormRow>
      </SectionCard>

      {/* Privacy */}
      <SectionCard title="Privacy" icon={Shield}>
        <FormRow label="Public Profile" hint="Allow other users to view your profile page">
          <Toggle checked={settings.publicProfile} onChange={(v) => set('publicProfile', v)} />
        </FormRow>
        <FormRow label="Show on Leaderboard" hint="Include your name and rank in the global leaderboard">
          <Toggle checked={settings.showOnLeaderboard} onChange={(v) => set('showOnLeaderboard', v)} />
        </FormRow>
        <FormRow label="Share Learning Progress" hint="Let your progress be visible to peers and instructors">
          <Toggle checked={settings.shareProgress} onChange={(v) => set('shareProgress', v)} />
        </FormRow>
      </SectionCard>

      {/* Danger zone */}
      <SectionCard title="Danger Zone" icon={AlertTriangle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid #f0d9a8',
            background: '#fffbf0',
          }}
        >
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-ink)' }}>Sign Out</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--color-inkmuted)', marginTop: 2 }}>
              Sign out of your QUBERA account on this device.
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              borderRadius: 12,
              border: '1px solid #d3a67a',
              background: '#fff',
              color: '#7a5a1a',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </SectionCard>
    </div>
  )
}