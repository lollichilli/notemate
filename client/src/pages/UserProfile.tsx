import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PasswordInput } from '../components/PasswordStrengthIndicator'

const UserProfile = () => {
  const { user, updateProfile, updatePassword, logout } = useAuth()
  
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  // Profile state
  const [name, setName] = useState(user?.name || '')
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setIsUpdatingProfile(true)

    try {
      await updateProfile({ name })
      setProfileSuccess('Profile updated successfully!')
      setIsEditingProfile(false)
      setTimeout(() => setProfileSuccess(''), 3000)
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // Validation
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    setIsUpdatingPassword(true)

    try {
      await updatePassword(currentPassword, newPassword)
      setPasswordSuccess('Password updated successfully!')
      setIsChangingPassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(''), 3000)
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to update password')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    setName(user?.name || '')
    setProfileError('')
  }

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '30px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '8px'
        }}>
          Profile Settings
        </h1>
        <p style={{
          color: '#666',
          fontSize: '14px'
        }}>
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Information Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600'
          }}>
            Profile Information
          </h2>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              style={{
                padding: '8px 16px',
                background: '#5B5FED',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Edit Profile
            </button>
          )}
        </div>

        {profileSuccess && (
          <div style={{
            padding: '12px',
            background: '#D1FAE5',
            color: '#065F46',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {profileSuccess}
          </div>
        )}

        {profileError && (
          <div style={{
            padding: '12px',
            background: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {profileError}
          </div>
        )}

        {!isEditingProfile ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#666',
                marginBottom: '4px'
              }}>
                Name
              </label>
              <div style={{
                fontSize: '16px',
                color: '#333'
              }}>
                {user?.name || 'Not set'}
              </div>
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#666',
                marginBottom: '4px'
              }}>
                Email
              </label>
              <div style={{
                fontSize: '16px',
                color: '#333'
              }}>
                {user?.email}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="name" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '4px'
              }}>
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#666',
                marginBottom: '4px'
              }}>
                Email
              </label>
              <div style={{
                fontSize: '16px',
                color: '#999',
                fontStyle: 'italic'
              }}>
                {user?.email} (cannot be changed)
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={isUpdatingProfile}
                style={{
                  padding: '10px 20px',
                  background: '#5B5FED',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isUpdatingProfile ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: isUpdatingProfile ? 0.6 : 1
                }}
              >
                {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isUpdatingProfile}
                style={{
                  padding: '10px 20px',
                  background: '#E5E7EB',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Change Password Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600'
          }}>
            Password
          </h2>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              style={{
                padding: '8px 16px',
                background: '#5B5FED',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Change Password
            </button>
          )}
        </div>

        {passwordSuccess && (
          <div style={{
            padding: '12px',
            background: '#D1FAE5',
            color: '#065F46',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {passwordSuccess}
          </div>
        )}

        {passwordError && (
          <div style={{
            padding: '12px',
            background: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {passwordError}
          </div>
        )}

        {!isChangingPassword ? (
          <p style={{
            color: '#666',
            fontSize: '14px'
          }}>
            ••••••••
          </p>
        ) : (
          <form onSubmit={handleUpdatePassword}>
            <div style={{ marginBottom: '16px' }}>
              <PasswordInput
                id="current-password"
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <PasswordInput
                id="new-password"
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <PasswordInput
                id="confirm-password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={isUpdatingPassword}
                style={{
                  padding: '10px 20px',
                  background: '#5B5FED',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isUpdatingPassword ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: isUpdatingPassword ? 0.6 : 1
                }}
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={handleCancelPasswordChange}
                disabled={isUpdatingPassword}
                style={{
                  padding: '10px 20px',
                  background: '#E5E7EB',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account Management Section */}
        <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #FEE2E2',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
        <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#DC2626',
            marginBottom: '12px'
        }}>
            Account Management
        </h2>
        <p style={{
            color: '#666',
            fontSize: '14px',
            marginBottom: '16px'
        }}>
            Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
            onClick={() => {
            if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                // Implement delete account logic
                alert('Delete account functionality - implement with backend')
            }
            }}
            style={{
            padding: '10px 20px',
            background: '#DC2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#B91C1C'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#DC2626'}
        >
            Delete Account
        </button>
        </div>
    </div>
  )
}

export default UserProfile