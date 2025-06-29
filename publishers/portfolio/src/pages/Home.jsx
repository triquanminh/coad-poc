import { useEffect } from 'react'
import '../App.css'

function Home() {
  // Placeholder for bot injection
  useEffect(() => {
    // This is where the adSdk bot will be injected
    console.log('Home page loaded - ready for bot injection')
  }, [])

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Hi, I'm <span className="highlight">John Doe</span>
            </h1>
            <h2 className="hero-subtitle">Full Stack Developer</h2>
            <p className="hero-description">
              I create beautiful and functional web applications using modern technologies.
              Passionate about clean code, user experience, and innovative solutions.
            </p>
            <div className="hero-buttons">
              <a href="#projects" className="btn btn-primary">View My Work</a>
              <a href="#contact" className="btn btn-secondary">Get In Touch</a>
            </div>
          </div>
          <div className="hero-image">
            <div className="profile-placeholder">
              <div className="profile-icon">👨‍💻</div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="skills">
        <div className="container">
          <h2 className="section-title">Skills & Technologies</h2>
          <div className="skills-grid">
            <div className="skill-category">
              <h3>Frontend</h3>
              <div className="skill-tags">
                <span className="skill-tag">React</span>
                <span className="skill-tag">Vue.js</span>
                <span className="skill-tag">JavaScript</span>
                <span className="skill-tag">TypeScript</span>
                <span className="skill-tag">HTML5</span>
                <span className="skill-tag">CSS3</span>
                <span className="skill-tag">Sass</span>
              </div>
            </div>
            <div className="skill-category">
              <h3>Backend</h3>
              <div className="skill-tags">
                <span className="skill-tag">Node.js</span>
                <span className="skill-tag">Python</span>
                <span className="skill-tag">Express</span>
                <span className="skill-tag">Django</span>
                <span className="skill-tag">PostgreSQL</span>
                <span className="skill-tag">MongoDB</span>
              </div>
            </div>
            <div className="skill-category">
              <h3>Tools & Others</h3>
              <div className="skill-tags">
                <span className="skill-tag">Git</span>
                <span className="skill-tag">Docker</span>
                <span className="skill-tag">AWS</span>
                <span className="skill-tag">Figma</span>
                <span className="skill-tag">Jest</span>
                <span className="skill-tag">Webpack</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="projects">
        <div className="container">
          <h2 className="section-title">Featured Projects</h2>
          <div className="projects-grid">
            <div className="project-card">
              <div className="project-image">
                <div className="project-placeholder">🚀</div>
              </div>
              <div className="project-content">
                <h3>E-Commerce Platform</h3>
                <p>A full-stack e-commerce solution built with React and Node.js</p>
                <div className="project-tech">
                  <span>React</span>
                  <span>Node.js</span>
                  <span>MongoDB</span>
                </div>
                <div className="project-links">
                  <a href="#" className="project-link">Live Demo</a>
                  <a href="#" className="project-link">GitHub</a>
                </div>
              </div>
            </div>

            <div className="project-card">
              <div className="project-image">
                <div className="project-placeholder">📱</div>
              </div>
              <div className="project-content">
                <h3>Task Management App</h3>
                <p>A collaborative task management application with real-time updates</p>
                <div className="project-tech">
                  <span>Vue.js</span>
                  <span>Socket.io</span>
                  <span>Express</span>
                </div>
                <div className="project-links">
                  <a href="#" className="project-link">Live Demo</a>
                  <a href="#" className="project-link">GitHub</a>
                </div>
              </div>
            </div>

            <div className="project-card">
              <div className="project-image">
                <div className="project-placeholder">📊</div>
              </div>
              <div className="project-content">
                <h3>Analytics Dashboard</h3>
                <p>A data visualization dashboard for business analytics</p>
                <div className="project-tech">
                  <span>React</span>
                  <span>D3.js</span>
                  <span>Python</span>
                </div>
                <div className="project-links">
                  <a href="#" className="project-link">Live Demo</a>
                  <a href="#" className="project-link">GitHub</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="container">
          <h2 className="section-title">Get In Touch</h2>
          <div className="contact-content">
            <div className="contact-info">
              <h3>Let's work together!</h3>
              <p>
                I'm always interested in new opportunities and exciting projects.
                Feel free to reach out if you'd like to collaborate!
              </p>
              <div className="contact-details">
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <span>john.doe@example.com</span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📱</span>
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📍</span>
                  <span>San Francisco, CA</span>
                </div>
              </div>
            </div>
            <form className="contact-form">
              <div className="form-group">
                <input type="text" placeholder="Your Name" required />
              </div>
              <div className="form-group">
                <input type="email" placeholder="Your Email" required />
              </div>
              <div className="form-group">
                <input type="text" placeholder="Subject" required />
              </div>
              <div className="form-group">
                <textarea placeholder="Your Message" rows="5" required></textarea>
              </div>
              <button type="submit" className="btn btn-primary">Send Message</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
