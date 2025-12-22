import React from 'react';
import './About.css';
import {
  Target,
  Brain,
  Rocket,
  Clock,
  GitBranch,
  Zap,
  Lightbulb,
  Palette,
  Code2,
  Twitter,
  Github,
  Instagram,
  Linkedin,
  AlertCircle,
  Shield,
  Award,
  Heart
} from 'lucide-react';

const About = () => {
  return (
    <div className="about-container">
      <div className="about-header">
        <h1 className="about-title">About This Platform</h1>
        <div className="title-line"></div>
      </div>

      <section className="about-section mission-section">
        <p className="lead-text">
          This platform was built with one simple intention —<br />
          to help students and self-learners come out of career confusion and 
          build real skills with a strong mindset, not fear or demotivation.
        </p>
      </section>

      <section className="about-section problem-section">
        <h2 className="section-title">The Problem We're Solving</h2>
        <p className="hinglish-text">
          Aaj ke time me bahot saare log YouTube aur online classes se padhte hain, 
          aur main maanta hoon ki <span className="highlight">👉 human ke through samjhaya gaya content often best hota hai</span>, 
          kyunki wo relatable hota hai aur easily samajh aata hai.
        </p>
        <p className="hinglish-text">
          Lekin ek problem bhi hai. Kai baar:
        </p>
        <div className="problem-card">
          <div className="problem-icon">
            <Clock size={32} style={{background:"transparent"}}/>
          </div>
          <h3>Time Waste Problem</h3>
          <p style={{background:"transparent"}}>2 minute ka simple topic 20–30 minute ka bana diya jaata hai
          sirf watch time, views aur algorithms ke liye.</p>
        </div>
        
        <div className="impact-list" >
          <div className="impact-item" >
            <div className="impact-icon" >
              <Clock size={24} style={{background:"transparent"}}/>
            </div>
            <span style={{background:"transparent"}}>Student ka time waste hota hai</span>
          </div>
          <div className="impact-item">
            <div className="impact-icon">
              <GitBranch size={24} style={{background:"transparent"}}/>
            </div>
            <span style={{background:"transparent"}}>Flow break hota hai</span>
          </div>
          <div className="impact-item">
            <div className="impact-icon">
              <AlertCircle size={24} style={{background:"transparent"}}/>
            </div>
            <span style={{background:"transparent"}}>Aur beginner confuse ho jaata hai</span>
          </div>
        </div>
      </section>

      <section className="about-section purpose-section">
        <h2 className="section-title" >Why I Built This</h2>
        <p className="hinglish-text">
          Is platform ka goal YouTube ya teachers ko replace karna nahi hai.
          Goal sirf itna hai ki:
        </p>
        
        <div className="target-audience" style={{background:"transparent"}}>
          <div className="audience-card">
            <div className="card-icon">
              <Target size={36} style={{background:"transparent"}}/>
            </div>
            <h3 style={{background:"transparent"}}>Jo log seriously seekhna chahte hain</h3>
          </div>
          <div className="audience-card">
            <div className="card-icon">
              <Brain size={36} style={{background:"transparent"}}/>
            </div>
            <h3 style={{background:"transparent"}}>Jo log time-pass nahi, clarity chahte hain</h3>
          </div>
          <div className="audience-card">
            <div className="card-icon">
              <Rocket size={36} style={{background:"transparent"}}/>
            </div>
            <h3 style={{background:"transparent"}}>Jo log non-IT se IT ya beginner se professional banna chahte hain</h3>
          </div>
        </div>
        
        <div className="platform-features" >
          <h3 style={{background:"transparent"}}>Yahan:</h3>
          <ul className="features-list" style={{background:"transparent"}}>
            <li style={{background:"transparent"}}>Content direct & point-to-point hai</li>
            <li style={{background:"transparent"}}>English + Hinglish dono me explain kiya gaya hai</li>
            <li style={{background:"transparent"}}>Practice questions ke answers by default hidden rehte hain</li>
            <li style={{background:"transparent"}}>"Pehle khud koshish kare – make your mind strong"</li>
          </ul>
          <p className="note-text">
            Because real growth tab hoti hai jab aap khud sochte ho, sirf copy nahi karte.
          </p>
        </div>
      </section>

      <section className="about-section interview-section">
        <h2 className="section-title">Interview Mindset Matters</h2>
        <p className="hinglish-text">
          Interview preparation yahan sirf questions ya answers ka game nahi hai.
          Is platform ka focus hai:
        </p>
        
        <div className="mindset-grid" style={{background:"transparent"}}>
          <div className="mindset-item">
            <div className="mindset-icon">
              <Shield size={36} style={{background:"transparent"}}/>
            </div>
            <h4 style={{background:"transparent"}}>Real interview traps</h4>
          </div>
          <div className="mindset-item">
            <div className="mindset-icon">
              <Brain size={36} style={{background:"transparent"}}/>
            </div>
            <h4 style={{background:"transparent"}}>Experience-based thinking</h4>
          </div>
          <div className="mindset-item">
            <div className="mindset-icon">
              <Award size={36} style={{background:"transparent"}}/>
            </div>
            <h4 style={{background:"transparent"}}>Calm & clear mindset</h4>
          </div>
        </div>
        
        <div className="failure-message">
          <p className="hinglish-text">
            Agar kisi question ka answer nahi aata:
          </p>
          <div className="comparison" style={{background:"transparent"}}>
            <div className="wrong">
              <h4 style={{background:"transparent"}}>❌ Kya Nahi Hai:</h4>
              <p style={{background:"transparent"}}>• koi fail message nahi</p>
              <p style={{background:"transparent"}}>• koi demotivation nahi</p>
            </div>
            <div className="right">
              <h4 style={{background:"transparent"}}>✅ Kya Hai:</h4>
              <p style={{background:"transparent"}}>• bas ek signal — ye ek weak area hai, jise improve kiya ja sakta hai.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section opensource-section">
        <h2 className="section-title">Open Source & Community Driven <Heart size={24} style={{display: 'inline-block', marginLeft: '8px', color: '#e74c3c', background:"transparent"}}/></h2>
        <p className="hinglish-text">
          Mere saare projects open-source hain. Agar:
        </p>

        <div className="contribute-options" style={{background:"transparent"}}>
          <div className="option">
            <div className="option-icon">
              <Lightbulb size={28} style={{background:"transparent"}}/>
            </div>
            <p style={{background:"transparent"}}>aapke paas koi naya idea hai</p>
          </div>
          <div className="option">
            <div className="option-icon">
              <Palette size={28} style={{background:"transparent"}}/>
            </div>
            <p style={{background:"transparent"}}>aap apni creativity add karna chahte ho</p>
          </div>
          <div className="option">
            <div className="option-icon">
              <Zap size={28} style={{background:"transparent"}}/>
            </div>
            <p style={{background:"transparent"}}>ya kisi feature ko aur better banana chahte ho</p>
          </div>
        </div>
        
        <div className="cta-box">
          <p className="cta-text" style={{background:"transparent"}}>
            👉 to aap bilkul free ho contribute karne ke liye.<br />
            Aap apne ideas mujhse share kar sakte ho —<br />
            hum milkar in projects par kaam kar sakte hain.
          </p>
        </div>
      </section>

      <section className="about-section connect-section">
        <h2 className="section-title">Let's Connect 🌐</h2>
        <p className="hinglish-text">Aap mujhe yahan follow / connect kar sakte ho</p>
        
        <div className="social-links">
          <a href="https://x.com/developer_azaz" className="social-link twitter">
            <span className="social-icon">
              <Twitter size={24} style={{background:"transparent"}} />
            </span>
            <span className='social-name'>Twitter / X</span>
          </a>
          <a href="https://github.com/Azaz-Gori07" className="social-link github">
            <span className="social-icon">
              <Github size={24} style={{background:"transparent"}}/>
            </span>
            <span className='social-name'>GitHub</span>
          </a>
          <a href="https://www.instagram.com/azaz__wri8s" className="social-link instagram">
            <span className="social-icon">
              <Instagram size={24} />
            </span>
            <span className='social-name'>Instagram</span>
          </a>
          <a href="https://www.linkedin.com/in/ijaj-gori-36298338a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" className="social-link linkedin">
            <span className="social-icon">
              <Linkedin size={24} />
            </span>
            <span className='social-name'>LinkedIn</span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default About;