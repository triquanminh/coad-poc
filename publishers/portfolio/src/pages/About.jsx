import { useEffect } from 'react'
import '../App.css'

function About() {
  // Placeholder for bot injection
  useEffect(() => {
    // This is where the adSdk bot will be injected
    console.log('About page loaded - ready for bot injection')
  }, [])

  return (
    <div className="about-page">
      {/* About Page Content */}
      <section className="about">
        <div className="container">
          <h1 className="section-title">About John Doe</h1>
          <div className="about-content">
            <div className="about-text">
              <p>
                I'm a passionate full-stack developer with over 5 years of experience
                creating web applications that solve real-world problems. I love working
                with modern technologies and am always eager to learn new skills.
              </p>
              <p>
                My journey in web development started during my computer science studies,
                where I discovered my passion for creating digital solutions that make
                a difference. Since then, I've worked with startups and established
                companies, helping them build robust and scalable web applications.
              </p>
              <p>
                When I'm not coding, you can find me exploring new technologies,
                contributing to open-source projects, hiking in nature, or enjoying
                a good book on software architecture and design patterns.
              </p>
            </div>
            
            <div className="about-stats">
              <div className="stat">
                <h3>50+</h3>
                <p>Projects Completed</p>
              </div>
              <div className="stat">
                <h3>5+</h3>
                <p>Years Experience</p>
              </div>
              <div className="stat">
                <h3>30+</h3>
                <p>Happy Clients</p>
              </div>
              <div className="stat">
                <h3>15+</h3>
                <p>Technologies Mastered</p>
              </div>
            </div>
          </div>

          {/* Experience Timeline */}
          <div className="experience-section">
            <h2 className="section-title">Professional Experience</h2>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-date">2022 - Present</div>
                <div className="timeline-content">
                  <h3>Senior Full Stack Developer</h3>
                  <h4>TechCorp Solutions</h4>
                  <p>Leading development of enterprise web applications using React, Node.js, and cloud technologies.</p>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-date">2020 - 2022</div>
                <div className="timeline-content">
                  <h3>Full Stack Developer</h3>
                  <h4>StartupXYZ</h4>
                  <p>Built scalable web applications from scratch, implemented CI/CD pipelines, and mentored junior developers.</p>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-date">2019 - 2020</div>
                <div className="timeline-content">
                  <h3>Frontend Developer</h3>
                  <h4>Digital Agency Pro</h4>
                  <p>Developed responsive websites and web applications for various clients using modern frontend frameworks.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Education */}
          <div className="education-section">
            <h2 className="section-title">Education & Certifications</h2>
            <div className="education-grid">
              <div className="education-item">
                <h3>Bachelor of Computer Science</h3>
                <h4>University of Technology</h4>
                <p>2015 - 2019</p>
              </div>
              <div className="education-item">
                <h3>AWS Certified Developer</h3>
                <h4>Amazon Web Services</h4>
                <p>2021</p>
              </div>
              <div className="education-item">
                <h3>React Developer Certification</h3>
                <h4>Meta</h4>
                <p>2020</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
