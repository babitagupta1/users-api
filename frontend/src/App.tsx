import { useState } from 'react'
import './App.css'
import type { ChangeEvent } from 'react'

function App() {
  const [userId, setUserId] = useState('')
  const [token, setToken] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [message, setMessage] = useState('')

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) return

    if (!selectedFile.type.startsWith('image/')) {
      setMessage('Please select an image file.')
      return
    }

    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setMessage('')
  }

  async function handleUpload() {
    if (!userId.trim() || !token.trim() || !file) {
      setMessage('Enter the user ID, access token, and choose an image.')
      return
    }

    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const response = await fetch(
        `/api/v1/users/${encodeURIComponent(userId)}/avatar`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message ?? 'Upload failed.')
      }

      setMessage('Avatar uploaded successfully!')
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong.',
      )
    }
  }

  async function handleDelete() {
    if (!userId.trim() || !token.trim()) {
      setMessage('Enter the user ID and access token first.')
      return
    }

    try {
      const response = await fetch(
        `/api/v1/users/${encodeURIComponent(userId)}/avatar`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message ?? 'Delete failed.')
      }

      setFile(null)
      setPreview('')
      setMessage('Avatar deleted successfully!')
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong.',
      )
    }
  }

  return (
    <main className="page">
      <section className="avatar-card">
        <h1>User Avatar Manager</h1>
        <p>Upload and manage a user's profile picture.</p>

        <label htmlFor="userId">User ID</label>
        <input
          id="userId"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          placeholder="Enter user ID"
        />

        <label htmlFor="token">Access Token</label>
        <input
          id="token"
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Paste your access token"
        />

        <div className="preview">
          {preview ? (
            <img src={preview} alt="Selected avatar preview" />
          ) : (
            <span>No avatar selected</span>
          )}
        </div>

        <label htmlFor="avatarFile">Choose an image</label>
        <input
          id="avatarFile"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
        />

        <button onClick={handleUpload} disabled={!file}>
          Upload Avatar
        </button>

        <button className="delete-button" onClick={handleDelete}>
          Delete Avatar
        </button>

        {message && <p className="message">{message}</p>}
      </section>
    </main>
  )
}

export default App