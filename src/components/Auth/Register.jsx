const { useState } = React;

function Register({ apiBaseUrl, onRegisterSuccess, onToggleMode, darkMode, onToggleTheme }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || !phoneNumber) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          phone_number: phoneNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed.");
      } else {
        setSuccess("Registered successfully! Redirecting to login...");
        setTimeout(() => {
          onRegisterSuccess();
        }, 1500);
      }
    } catch (err) {
      setError("Cannot connect to server. Please check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-wrapper ${darkMode ? "dark" : ""}`}>
      <div className="auth-theme-toggle">
        <button className="theme-btn" onClick={onToggleTheme}>
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p className="auth-subtitle">Join KAIC AI Meeting Recorder</p>
        </div>

        {error && (
          <div className="auth-alert error">
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-alert success">
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="auth-input"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading || success !== ""}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              className="auth-input"
              placeholder="Enter unique phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading || success !== ""}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="auth-input"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || success !== ""}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="eye-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="eye-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading || success !== ""}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="auth-toggle">
          Already have an account?
          <span className="auth-link" onClick={onToggleMode}>
            Sign In
          </span>
        </div>
      </div>
    </div>
  );
}

window.Register = Register;
