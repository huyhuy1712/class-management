import { Link } from 'react-router-dom'
import logo from '../../../assets/logos/logo.png'
import '../auth.css'

function AuthLayout({ title, description, variant = 'login', children }) {
  return (
    <main className={`auth-page auth-page--${variant}`}>
      <Link to="/" className="auth-brand" aria-label="FrogH — Trang chủ">
        <img src={logo} alt="" />
        <span><strong>FrogH</strong><small>Education System</small></span>
      </Link>
      <section className={`auth-card auth-card--${variant}`} aria-labelledby="auth-title">
        <header className="auth-heading">
          <span className="auth-eyebrow">CLASS MANAGEMENT</span>
          <h1 id="auth-title">{title}</h1>
          <p>{description}</p>
        </header>
        {children}
      </section>
      <p className="auth-footer">Made by FrogH</p>
    </main>
  )
}

export default AuthLayout
