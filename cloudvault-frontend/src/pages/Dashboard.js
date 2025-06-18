import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";

// UploadThing integration
import { UploadButton } from "../utils/uploadthing";
import "@uploadthing/react/styles.css";

function Dashboard() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [encryptionMethod, setEncryptionMethod] = useState("aes");
  const [theme, setTheme] = useState("light");
  const [sortOrder, setSortOrder] = useState("latest");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [compressing, setCompressing] = useState({});
  const navigate = useNavigate();

  const totalFiles = files.length;
  const totalStorage = files.reduce((acc, file) => acc + file.size, 0);

  const fetchFiles = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/files");
      let fileList = res.data;

      if (sortOrder === "latest") {
        fileList.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      } else if (sortOrder === "size") {
        fileList.sort((a, b) => b.size - a.size);
      } else if (sortOrder === "aes") {
        fileList.sort((a, b) => {
          if (a.encryptionMethod === "aes" && b.encryptionMethod !== "aes") return -1;
          if (a.encryptionMethod !== "aes" && b.encryptionMethod === "aes") return 1;
          return 0;
        });
      } else if (sortOrder === "aes+rsa") {
        fileList.sort((a, b) => {
          if (a.encryptionMethod === "aes+rsa" && b.encryptionMethod !== "aes+rsa") return -1;
          if (a.encryptionMethod !== "aes+rsa" && b.encryptionMethod === "aes+rsa") return 1;
          return 0;
        });
      }

      setFiles(fileList);
    } catch (err) {
      console.error("Failed to fetch files:", err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [sortOrder]);

  // Drag & Drop handlers
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("encryptionMethod", encryptionMethod);

    try {
      setUploadProgress(0);
      await axios.post("http://localhost:5000/api/files/upload", formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });
      setSelectedFile(null);
      setUploadProgress(0);
      fetchFiles();
    } catch (err) {
      setUploadProgress(0);
      console.error("Upload failed:", err);
    }
  };

  const handleDownload = async (fileId, originalName) => {
    try {
      setDownloadProgress((prev) => ({ ...prev, [fileId]: 0 }));
      const res = await axios.get(`http://localhost:5000/api/files/download/${fileId}`, {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setDownloadProgress((prev) => ({ ...prev, [fileId]: percent }));
        },
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", originalName || `file-${Date.now()}`);
      document.body.appendChild(link);
      link.click();
      setDownloadProgress((prev) => ({ ...prev, [fileId]: 0 }));
    } catch (err) {
      setDownloadProgress((prev) => ({ ...prev, [fileId]: 0 }));
      console.error("Download failed:", err);
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await axios.delete(`http://localhost:5000/api/files/${fileId}`);
      fetchFiles();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Handle file compression after upload
  const handleCompress = async (fileId) => {
    setCompressing((prev) => ({ ...prev, [fileId]: true }));
    try {
      const res = await axios.post(`http://localhost:5000/api/files/compress/${fileId}`);
      if (res.data && res.data.downloadUrl) {
        // Download as blob to avoid redirect
        const fileResponse = await axios.get(`http://localhost:5000${res.data.downloadUrl}`, {
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([fileResponse.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', res.data.downloadUrl.split('/').pop());
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        fetchFiles();
      }
    } catch (err) {
      alert("Compression failed. Please try again.");
      console.error("Compression failed:", err);
    }
    setCompressing((prev) => ({ ...prev, [fileId]: false }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Helper: Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Helper: Format storage
  const formatStorage = (bytes) => {
    if (bytes >= 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    if (bytes >= 1024)
      return (bytes / 1024).toFixed(2) + " KB";
    return bytes + " B";
  };

  // Encryption badge component
  const EncryptionBadge = ({ method }) => (
    <span
      className={`encryption-badge ${method === "aes" ? "aes-badge" : "aesrsa-badge"}`}
      title={method === "aes" ? "AES Encryption" : "AES + RSA Encryption"}
    >
      {method === "aes" ? "AES" : "AES + RSA"} 🛡️
    </span>
  );

  return (
    <div className={`dashboard ${theme}`}>
      <div className="dashboard-header">
        <h1 className={`dashboard-title center-title ${theme}`}>CloudVault</h1>
        <div className="header-actions">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Storage Used Widget */}
      <div className="storage-widget">
        <span>📊 Total Files: {totalFiles}</span>
        <span> | Total Storage Used: {formatStorage(totalStorage)}</span>
        <span> | Current date: {new Date().toLocaleString("en-GB", { weekday: "long", year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZoneName: "short" })}</span>
      </div>

      {/* Upload Section with clear labels */}
      <div
        className={`upload-section${dragActive ? " drag-active" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Label for Local Disk Upload */}
        <label className="upload-label">Upload (Local Disk)</label>
        <div className="local-upload-group">
          <input
            type="file"
            onChange={handleFileChange}
            className="file-input"
            ref={inputRef}
            style={{ display: "none" }}
          />
          <div
            className="dropzone"
            onClick={() => inputRef.current && inputRef.current.click()}
          >
            {selectedFile ? (
              <span>Selected: {selectedFile.name}</span>
            ) : (
              <span>
                Drag & drop file here, or <span className="browse-link">browse</span>
              </span>
            )}
          </div>
          <select
            value={encryptionMethod}
            onChange={(e) => setEncryptionMethod(e.target.value)}
            className="dropdown"
          >
            <option value="aes">AES</option>
            <option value="aes+rsa">AES + RSA</option>
          </select>
          <button className="upload-btn" onClick={handleUpload}>
            ⬆️ Upload
          </button>
        </div>

        {/* Label for UploadThing Cloud Upload */}
        <label className="upload-label" style={{ marginTop: "1em" }}>
          Upload to Cloud (UploadThing)
        </label>
        <div className="cloud-upload-group">
          <UploadButton
            endpoint="cloudUploader"
            onClientUploadComplete={(res) => {
              console.log("Files:", res);
              alert("Upload Completed");
              fetchFiles();
            }}
            onUploadError={(error) => {
              console.error("Error:", error);
              alert(`ERROR! ${error.message}`);
            }}
          />
        </div>
      </div>

      {/* Upload Progress Bar */}
      {uploadProgress > 0 && (
        <div className="progress-bar">
          <div
            className="progress-bar-inner"
            style={{ width: `${uploadProgress}%` }}
          >
            {uploadProgress}%
          </div>
        </div>
      )}

      <div className="file-list">
        {files.length > 0 ? (
          files.map((file) => (
            <div className="file-item" key={file._id}>
              <div className="file-info">
                <h3>{file.originalName}</h3>
                <p>Size: {formatStorage(file.size)}</p>
                {/* Encryption Badge */}
                <EncryptionBadge method={file.encryptionMethod} />
                {/* Upload Date */}
                <p className="upload-date">
                  ⏳ Uploaded on: {formatDate(file.uploadedAt)}
                </p>
              </div>
              <div className="file-actions">
                <button
                  className="download-btn"
                  onClick={() => handleDownload(file._id, file.originalName)}
                >
                  Download
                </button>
                {/* Download Progress Bar */}
                {downloadProgress[file._id] > 0 && (
                  <div className="progress-bar download-progress">
                    <div
                      className="progress-bar-inner"
                      style={{ width: `${downloadProgress[file._id]}%` }}
                    >
                      {downloadProgress[file._id]}%
                    </div>
                  </div>
                )}
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(file._id)}
                >
                  Delete
                </button>
                {/* Compress Button */}
                <button
                  className="compress-btn"
                  onClick={() => handleCompress(file._id)}
                  disabled={!!compressing[file._id]}
                >
                  {compressing[file._id] ? "Compressing..." : "Compress"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-files">No files uploaded yet.</div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
