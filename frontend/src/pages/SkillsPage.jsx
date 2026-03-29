import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

// ── SKILL MASTER DATA ─────────────────────────────────────────
const ALL_SKILLS = [
  {
    name: 'Python', category: 'Programming', importance: 'High',
    what: 'A versatile, beginner-friendly programming language used across web dev, data science, and automation.',
    where: 'Data Science, ML/AI, Backend APIs, Scripting, Automation',
    why: 'Most in-demand language in India placements. Required by TCS, Infosys, Wipro, Amazon, Google and almost every product company.',
    courses: [
      { name: 'Python for Everybody – Coursera', url: 'https://coursera.org/specializations/python' },
      { name: 'Python – HackerRank', url: 'https://hackerrank.com/domains/python' },
      { name: 'Python – NPTEL', url: 'https://nptel.ac.in/courses/106106182' },
    ]
  },
  {
    name: 'Java', category: 'Programming', importance: 'High',
    what: 'Object-oriented language widely used in enterprise software, Android development, and backend systems.',
    where: 'Enterprise Apps, Android, Backend Services, Banking Systems',
    why: 'Core requirement for TCS, Infosys, Wipro, Cognizant interviews. Strong OOP concepts in Java = interview success.',
    courses: [
      { name: 'Java Programming – NPTEL', url: 'https://nptel.ac.in/courses/106105191' },
      { name: 'Java – HackerRank', url: 'https://hackerrank.com/domains/java' },
    ]
  },
  {
    name: 'Data Structures', category: 'Core CS', importance: 'Critical',
    what: 'Fundamental ways to organize data: arrays, linked lists, trees, graphs, heaps, and hash tables.',
    where: 'Every software engineering interview, competitive programming, system design',
    why: 'Without DSA, you cannot clear any product company interview. It is the single most important skill for placements.',
    courses: [
      { name: 'DSA – NPTEL', url: 'https://nptel.ac.in/courses/106102064' },
      { name: 'LeetCode DSA Study Plan', url: 'https://leetcode.com/study-plan/data-structure/' },
    ]
  },
  {
    name: 'Algorithms', category: 'Core CS', importance: 'Critical',
    what: 'Step-by-step problem-solving procedures: sorting, searching, dynamic programming, greedy, graphs.',
    where: 'Coding rounds, technical interviews, competitive programming',
    why: 'Amazon, Flipkart, Zoho, and all product companies test algorithms heavily. Dynamic programming alone covers 30% of LeetCode hard problems.',
    courses: [
      { name: 'Algorithms – Coursera (Stanford)', url: 'https://coursera.org/specializations/algorithms' },
      { name: 'LeetCode Algorithms', url: 'https://leetcode.com/study-plan/algorithm/' },
    ]
  },
  {
    name: 'SQL', category: 'Database', importance: 'High',
    what: 'Structured Query Language used to query and manage relational databases.',
    where: 'Backend development, Data Analytics, Business Intelligence, every software system',
    why: 'Almost every company — TCS, Infosys, Accenture, Zoho — has SQL in written test. It is fast to learn and high ROI.',
    courses: [
      { name: 'SQL for Data Science – Coursera', url: 'https://coursera.org/learn/sql-for-data-science' },
      { name: 'SQL – HackerRank', url: 'https://hackerrank.com/domains/sql' },
    ]
  },
  {
    name: 'React', category: 'Frontend', importance: 'High',
    what: 'JavaScript library for building interactive user interfaces using components.',
    where: 'Web frontend development, SPAs, dashboards, mobile apps (React Native)',
    why: 'Most used frontend framework in Indian startups and product companies. Zoho, Freshworks, Razorpay all use React.',
    courses: [
      { name: 'React – freeCodeCamp', url: 'https://freecodecamp.org/learn/front-end-development-libraries/' },
      { name: 'React – official docs', url: 'https://react.dev/learn' },
    ]
  },
  {
    name: 'Machine Learning', category: 'AI/ML', importance: 'High',
    what: 'Teaching machines to learn from data and make predictions without explicit programming.',
    where: 'AI products, recommendation systems, fraud detection, computer vision, NLP',
    why: 'High-paying domain. Amazon, Flipkart, Jio, Ola all hire ML engineers. Sets you apart from pure software candidates.',
    courses: [
      { name: 'ML – Andrew Ng (Coursera)', url: 'https://coursera.org/specializations/machine-learning-introduction' },
      { name: 'ML – NPTEL', url: 'https://nptel.ac.in/courses/106106198' },
    ]
  },
  {
    name: 'System Design', category: 'Architecture', importance: 'High',
    what: 'Designing scalable, reliable distributed systems — databases, caches, load balancers, microservices.',
    where: 'Senior/final round interviews at product companies',
    why: 'Amazon, Flipkart, Paytm ask system design in final rounds. Even knowing basics like load balancing and caching gives you an edge.',
    courses: [
      { name: 'System Design Primer – GitHub', url: 'https://github.com/donnemartin/system-design-primer' },
      { name: 'Grokking System Design – Educative', url: 'https://educative.io/courses/grokking-modern-system-design-interview' },
    ]
  },
  {
    name: 'C', category: 'Programming', importance: 'Medium',
    what: 'Low-level procedural programming language. Foundation of all modern languages and operating systems.',
    where: 'Embedded systems, OS development, systems programming, competitive programming',
    why: 'GATE exam, core CS interviews, and embedded companies like L&T and Robert Bosch require C.',
    courses: [
      { name: 'C Programming – NPTEL', url: 'https://nptel.ac.in/courses/106105085' },
    ]
  },
  {
    name: 'C++', category: 'Programming', importance: 'Medium',
    what: 'Extension of C with OOP features. Used in high-performance systems and competitive programming.',
    where: 'Competitive programming, game development, finance systems, embedded',
    why: 'Best language for competitive programming (Codeforces, CodeChef). Faster problem-solving in coding rounds.',
    courses: [
      { name: 'C++ – LearnCpp', url: 'https://learncpp.com' },
      { name: 'C++ – NPTEL', url: 'https://nptel.ac.in/courses/106105151' },
    ]
  },
  {
    name: 'Communication', category: 'Soft Skills', importance: 'High',
    what: 'Ability to articulate technical thoughts, present ideas, and communicate clearly in interviews and team settings.',
    where: 'HR rounds, technical interviews, group discussions, client interactions',
    why: 'TCS, Infosys, Wipro, Accenture all have HR/communication rounds. Good communication can convert a good candidate to a selected one.',
    courses: [
      { name: 'English Communication – NPTEL', url: 'https://nptel.ac.in/courses/109104093' },
      { name: 'Communication Skills – Coursera', url: 'https://coursera.org/learn/wharton-communication-skills' },
    ]
  },
  {
    name: 'AWS', category: 'Cloud', importance: 'High',
    what: 'Amazon Web Services — the world\'s leading cloud platform offering compute, storage, and managed services.',
    where: 'Cloud deployment, DevOps, backend infrastructure, startups to enterprises',
    why: 'AWS certification is valued by almost all product companies. Zoho, Freshworks, Razorpay deploy on AWS.',
    courses: [
      { name: 'AWS Cloud Practitioner – Free', url: 'https://aws.amazon.com/training/digital/' },
      { name: 'AWS – Coursera', url: 'https://coursera.org/learn/aws-cloud-technical-essentials' },
    ]
  },
  {
    name: 'Git', category: 'DevOps', importance: 'High',
    what: 'Version control system for tracking code changes, collaboration, and managing codebases.',
    where: 'Every software company. GitHub is used by all teams for code collaboration.',
    why: 'Every company expects you to know Git. It is a hygiene requirement — not knowing it is a red flag.',
    courses: [
      { name: 'Git & GitHub – freeCodeCamp', url: 'https://freecodecamp.org/news/git-and-github-for-beginners/' },
      { name: 'Git – Atlassian Tutorial', url: 'https://atlassian.com/git/tutorials' },
    ]
  },
  {
    name: 'Node.js', category: 'Backend', importance: 'Medium',
    what: 'JavaScript runtime for building fast, scalable server-side applications and REST APIs.',
    where: 'Backend APIs, microservices, real-time apps, startups',
    why: 'Popular in Indian startups and product companies. Full-stack developers with React + Node are highly sought after.',
    courses: [
      { name: 'Node.js – freeCodeCamp', url: 'https://freecodecamp.org/learn/back-end-development-and-apis/' },
      { name: 'Node.js – NPTEL', url: 'https://nptel.ac.in' },
    ]
  },
  {
    name: 'MongoDB', category: 'Database', importance: 'Medium',
    what: 'NoSQL document database that stores data as flexible JSON-like documents.',
    where: 'Modern web apps, real-time data, content management, mobile backends',
    why: 'Used by Zomato, Swiggy, and many Indian startups. Knowing both SQL and MongoDB makes you versatile.',
    courses: [
      { name: 'MongoDB University – Free', url: 'https://university.mongodb.com' },
    ]
  },
  {
    name: 'Docker', category: 'DevOps', importance: 'Medium',
    what: 'Containerization platform to package apps and their dependencies for consistent deployment.',
    where: 'DevOps, cloud deployment, microservices, CI/CD pipelines',
    why: 'Companies like Zoho, Freshworks, and all cloud-first companies use Docker. Differentiates you in DevOps roles.',
    courses: [
      { name: 'Docker – freeCodeCamp', url: 'https://freecodecamp.org/news/the-docker-handbook/' },
    ]
  },
  {
    name: 'Operating Systems', category: 'Core CS', importance: 'High',
    what: 'Concepts: processes, threads, memory management, deadlocks, scheduling, file systems.',
    where: 'Technical interviews, GATE exam, systems programming',
    why: 'TCS, Infosys, Wipro, and all service companies ask OS in written tests. GATE aspirants need this deeply.',
    courses: [
      { name: 'OS – NPTEL', url: 'https://nptel.ac.in/courses/106105214' },
    ]
  },
  {
    name: 'Computer Networks', category: 'Core CS', importance: 'High',
    what: 'How computers communicate: TCP/IP, HTTP, DNS, routing, subnetting, OSI model.',
    where: 'Networking roles, backend interviews, GATE exam, cloud computing',
    why: 'Asked in TCS, Infosys, Wipro interviews. Cloud engineers need deep networking knowledge.',
    courses: [
      { name: 'Computer Networks – NPTEL', url: 'https://nptel.ac.in/courses/106105183' },
    ]
  },
  {
    name: 'DBMS', category: 'Core CS', importance: 'High',
    what: 'Database Management Systems — normalization, transactions, indexing, ACID properties, ER diagrams.',
    where: 'Almost every technical interview. Backend systems.',
    why: 'Core subject tested in every service company written test and most product company interviews.',
    courses: [
      { name: 'DBMS – NPTEL', url: 'https://nptel.ac.in/courses/106105175' },
    ]
  },
  {
    name: 'Deep Learning', category: 'AI/ML', importance: 'Medium',
    what: 'Neural networks with many layers that learn complex patterns in images, text, and audio.',
    where: 'Computer vision, NLP, speech recognition, AI research',
    why: 'Required for AI/ML roles at Amazon, Jio, research labs. PyTorch and TensorFlow are the tools.',
    courses: [
      { name: 'Deep Learning Specialization – Coursera', url: 'https://coursera.org/specializations/deep-learning' },
    ]
  },
  {
    name: 'Angular', category: 'Frontend', importance: 'Medium',
    what: 'TypeScript-based frontend framework by Google for building enterprise-grade SPAs.',
    where: 'Enterprise software, banking apps, large-scale frontend projects',
    why: 'Used by Infosys, Wipro, Accenture in enterprise projects. Alternative to React for service company roles.',
    courses: [
      { name: 'Angular – official docs', url: 'https://angular.io/start' },
    ]
  },
  {
    name: 'Spring Boot', category: 'Backend', importance: 'Medium',
    what: 'Java framework for building production-ready REST APIs and microservices quickly.',
    where: 'Enterprise Java backends, banking and fintech, Infosys, TCS projects',
    why: 'The go-to Java backend framework in Indian IT companies. Java + Spring Boot is a very hirable combination.',
    courses: [
      { name: 'Spring Boot – freeCodeCamp', url: 'https://freecodecamp.org/news/spring-boot-tutorial/' },
    ]
  },
  {
    name: 'Aptitude', category: 'Placement Prep', importance: 'Critical',
    what: 'Quantitative, logical, and verbal reasoning — percentage, profit/loss, puzzles, blood relations.',
    where: 'Every company written test: TCS, Infosys, Wipro, Capgemini, Accenture',
    why: 'You cannot even get to the technical round without clearing aptitude. Many students fail here. Practice daily.',
    courses: [
      { name: 'IndiaBix – Aptitude', url: 'https://indiabix.com' },
      { name: 'TCS iON Practice', url: 'https://tcsion.com' },
    ]
  },
  {
    name: 'Problem Solving', category: 'Placement Prep', importance: 'Critical',
    what: 'Ability to break down complex problems and write optimized solutions under time pressure.',
    where: 'Coding rounds, hackathons, technical interviews',
    why: 'The differentiator between service and product company offers. Practice LeetCode every day.',
    courses: [
      { name: 'LeetCode', url: 'https://leetcode.com' },
      { name: 'HackerRank', url: 'https://hackerrank.com' },
    ]
  },
  {
    name: 'Django', category: 'Backend', importance: 'Medium',
    what: 'Python web framework that follows MVC architecture for building full-stack web apps fast.',
    where: 'Web apps, REST APIs, startups, data-driven backends',
    why: 'Popular in Python-heavy companies and startups. Pairs well with ML skills for AI-powered web apps.',
    courses: [
      { name: 'Django – official tutorial', url: 'https://docs.djangoproject.com/en/stable/intro/tutorial01/' },
    ]
  },
  {
    name: 'Kubernetes', category: 'DevOps', importance: 'Low',
    what: 'Container orchestration system for automating deployment, scaling, and management of containers.',
    where: 'Large-scale cloud deployments, DevOps/SRE roles',
    why: 'Needed for DevOps engineer roles. Combined with Docker, it is the modern deployment stack.',
    courses: [
      { name: 'Kubernetes – freeCodeCamp', url: 'https://freecodecamp.org/news/the-kubernetes-handbook/' },
    ]
  },
  {
    name: 'Power BI', category: 'Data Analytics', importance: 'Medium',
    what: 'Microsoft business intelligence tool for creating interactive dashboards and data visualizations.',
    where: 'Data analyst roles, business reporting, consulting companies',
    why: 'TCS, Infosys, Accenture, Cognizant have data analyst roles requiring Power BI. Easy to learn, high ROI.',
    courses: [
      { name: 'Power BI – Microsoft Learn', url: 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi' },
    ]
  },
  {
    name: 'Tableau', category: 'Data Analytics', importance: 'Medium',
    what: 'Visual analytics platform for creating charts, maps, and dashboards from data.',
    where: 'Data analyst roles, business intelligence, analytics companies',
    why: 'Common in analytics and consulting roles. Pairs well with SQL and Excel.',
    courses: [
      { name: 'Tableau – official training', url: 'https://www.tableau.com/learn/training' },
    ]
  },
  {
    name: 'Linux', category: 'DevOps', importance: 'Medium',
    what: 'Open-source operating system. Knowing shell commands, file permissions, process management.',
    where: 'Backend development, DevOps, cloud infrastructure, server management',
    why: 'All servers run Linux. Backend and DevOps engineers use it daily. Many companies test basic Linux in interviews.',
    courses: [
      { name: 'Linux – NPTEL', url: 'https://nptel.ac.in/courses/117106113' },
      { name: 'Linux Command Line – freeCodeCamp', url: 'https://freecodecamp.org/news/command-line-for-beginners/' },
    ]
  },
  {
    name: 'TypeScript', category: 'Frontend', importance: 'Medium',
    what: 'Typed superset of JavaScript that catches errors at compile time and scales better.',
    where: 'Modern frontend codebases, large React/Angular apps, full-stack development',
    why: 'Most large companies use TypeScript over plain JavaScript now. Freshworks, Razorpay, Zoho use it.',
    courses: [
      { name: 'TypeScript – official docs', url: 'https://typescriptlang.org/docs/' },
    ]
  },
]
const handleMarkLearned = async (skillName) => {
  setMarkingSkill(skillName)
  try {
    await api.patch('/students/skills/learned', { skill_name: skillName })
    setMarkedSkills(prev => new Set([...prev, skillName.toLowerCase()]))
    // Optimistically update local profile state
    setProfile(prev => ({
      ...prev,
      skills: [...(prev?.skills || []), { skill_name: skillName }]
    }))
    setPopup(null)
  } catch (err) {
    alert('Could not save skill. Try again.')
  } finally {
    setMarkingSkill(null)
  }
}

const IMPORTANCE_CONFIG = {
  Critical: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  High:     { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  Medium:   { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  Low:      { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
}

const CATEGORY_COLORS = {
  'Programming':     '#7c3aed',
  'Core CS':         '#dc2626',
  'Database':        '#0891b2',
  'Frontend':        '#059669',
  'Backend':         '#d97706',
  'AI/ML':           '#7c3aed',
  'Cloud':           '#f97316',
  'DevOps':          '#0f172a',
  'Soft Skills':     '#ec4899',
  'Architecture':    '#6366f1',
  'Placement Prep':  '#dc2626',
  'Data Analytics':  '#0891b2',
}

// ── SKILL POPUP ───────────────────────────────────────────────
function SkillPopup({ skill, onClose, companyCount }) {
  const imp = IMPORTANCE_CONFIG[skill.importance] || IMPORTANCE_CONFIG.Medium
  const catColor = CATEGORY_COLORS[skill.category] || '#6b7280'

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520,
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          overflow: 'hidden', fontFamily: 'Sora, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{skill.name}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                  color: catColor, background: catColor + '18', border: `1px solid ${catColor}30`
                }}>{skill.category}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                  color: imp.color, background: imp.bg, border: `1px solid ${imp.border}`
                }}>⚡ {skill.importance} Importance</span>
                {companyCount > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca'
                  }}>🏢 {companyCount} {companyCount === 1 ? 'company' : 'companies'} require this</span>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{
              border: 'none', background: '#f1f5f9', borderRadius: 8,
              width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>✕</button>
            {!mySkillNames?.has(skill.name.toLowerCase()) && (
  <button
    onClick={() => onMarkLearned(skill.name)}
    disabled={markingSkill === skill.name}
    style={{
      width: '100%', padding: '12px', borderRadius: 10,
      background: markingSkill === skill.name ? '#f1f5f9' : '#0f172a',
      color: markingSkill === skill.name ? '#94a3b8' : '#fff',
      border: 'none', cursor: 'pointer', fontSize: 14,
      fontWeight: 700, fontFamily: 'Sora, sans-serif',
      transition: 'all 0.15s',
    }}
  >
    {markingSkill === skill.name ? '⏳ Saving...' : '✅ I\'ve learned this — add to my profile'}
  </button>
)}
{mySkillNames?.has(skill.name.toLowerCase()) && (
  <div style={{
    padding: '12px', borderRadius: 10, background: '#f0fdf4',
    border: '1px solid #bbf7d0', textAlign: 'center',
    fontSize: 13, color: '#16a34a', fontWeight: 600,
  }}>
    ✓ Already in your profile
  </div>
)}
          </div>
        </div>
        

        {/* Body */}
        <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 5 }}>WHAT IS IT</div>
            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{skill.what}</div>
          </div>
          <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', letterSpacing: '0.08em', marginBottom: 5 }}>WHERE IT'S USED</div>
            <div style={{ fontSize: 13, color: '#15803d', lineHeight: 1.6 }}>{skill.where}</div>
          </div>
          <div style={{ background: '#fffbeb', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', letterSpacing: '0.08em', marginBottom: 5 }}>WHY IT MATTERS FOR PLACEMENT</div>
            <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>{skill.why}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 8 }}>📚 LEARN IT HERE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {skill.courses.map((c, i) => (
                <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', background: '#f8fafc',
                    borderRadius: 8, border: '1px solid #e2e8f0',
                    textDecoration: 'none', fontSize: 13, color: '#1d4ed8', fontWeight: 500,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                >
                  <span style={{ fontSize: 16 }}>🔗</span> {c.name}
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── SKILL CARD ────────────────────────────────────────────────
function SkillCard({ skill, onClick, badge, companyCount }) {
  const imp = IMPORTANCE_CONFIG[skill.importance] || IMPORTANCE_CONFIG.Medium
  const catColor = CATEGORY_COLORS[skill.category] || '#6b7280'

  return (
    <div
      onClick={() => onClick(skill)}
      style={{
        background: '#fff', borderRadius: 12, padding: '14px 16px',
        border: `1.5px solid ${imp.border}`,
        cursor: 'pointer', transition: 'all 0.18s',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Importance accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: imp.color, borderRadius: '12px 12px 0 0'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>{skill.name}</div>
        {badge && (
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, flexShrink: 0, marginLeft: 6, ...badge.style }}>
            {badge.label}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
          color: catColor, background: catColor + '15'
        }}>{skill.category}</span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
          color: imp.color, background: imp.bg
        }}>{skill.importance}</span>
      </div>

      {companyCount > 0 && (
        <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 500 }}>
          🏢 {companyCount} {companyCount === 1 ? 'company' : 'companies'}
        </div>
      )}

      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Click to learn more →</div>
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function SkillsPage() {
  const [markingSkill, setMarkingSkill] = useState(null)
  const [markedSkills, setMarkedSkills] = useState(new Set())
  const [profile,    setProfile]    = useState(null)
  const [companies,  setCompanies]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState('all')
  const [popup,      setPopup]      = useState(null)
  const [search,     setSearch]     = useState('')
  const [filterCat,  setFilterCat]  = useState('All')
 


  useEffect(() => {
    Promise.all([
      api.get('/students/profile'),
      api.get('/students/dashboard').catch(() => ({ data: { companies: [] } }))
    ]).then(([profRes, dashRes]) => {
      setProfile(profRes.data)
      setCompanies(dashRes.data?.companies || [])
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="app-shell">
      <Sidebar role="student" />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </main>
    </div>
  )

  // My skills (from profile)
  const mySkillNames = new Set(
    (profile?.skills || []).map(s =>
      (typeof s === 'string' ? s : s?.skill_name || '').toLowerCase()
    )
  )

  // Build gap map from dashboard companies
  const gapMap = {}
  companies.forEach(c => {
    let sg = c.skill_gap || {}
    if (typeof sg === 'string') { try { sg = JSON.parse(sg) } catch { sg = {} } }
    Object.entries(sg).forEach(([skill, d]) => {
      if (!gapMap[skill]) gapMap[skill] = { ...d, companies: [c.company_name] }
      else if (!gapMap[skill].companies.includes(c.company_name))
        gapMap[skill].companies.push(c.company_name)
    })
  })

  // Missing skills sorted by company count
  const missingSkillNames = Object.entries(gapMap)
    .filter(([, d]) => !d.has_skill)
    .sort((a, b) => (b[1].companies?.length || 0) - (a[1].companies?.length || 0))
    .map(([name]) => name.toLowerCase())

  // Enrich ALL_SKILLS with company data
  const enrichedSkills = ALL_SKILLS.map(sk => ({
    ...sk,
    companyCount: gapMap[sk.name]?.companies?.length || 0,
  }))

  // Categories for filter
  const categories = ['All', ...new Set(ALL_SKILLS.map(s => s.category))]

  // ── TAB: ALL SKILLS ──
  const filteredAll = enrichedSkills.filter(sk => {
    const matchSearch = sk.name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = filterCat === 'All' || sk.category === filterCat
    return matchSearch && matchCat
  })

  // ── TAB: YOUR SKILLS ──
  const yourSkills = enrichedSkills.filter(sk => mySkillNames.has(sk.name.toLowerCase()))
  // Also include skills in profile that aren't in master list
  const unknownMySkills = (profile?.skills || [])
    .map(s => typeof s === 'string' ? s : s?.skill_name)
    .filter(name => name && !ALL_SKILLS.some(sk => sk.name.toLowerCase() === name.toLowerCase()))

  // ── TAB: RECOMMENDED ──
  const recommendedSkills = enrichedSkills
    .filter(sk => missingSkillNames.includes(sk.name.toLowerCase()))
    .sort((a, b) => b.companyCount - a.companyCount)
  // Also include gap skills not in master list
  const unknownGapSkills = missingSkillNames.filter(
    name => !ALL_SKILLS.some(sk => sk.name.toLowerCase() === name)
  )

  const tabs = [
    { id: 'all',         label: '📚 All Skills',      count: ALL_SKILLS.length },
    { id: 'yours',       label: '⚡ Your Skills',      count: mySkillNames.size },
    { id: 'recommended', label: '🎯 Recommended',      count: missingSkillNames.length },
  ]

  return (
    <div className="app-shell">
      <Sidebar role="student" />
      <main className="main-content">

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>
            Skills Hub
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>
            Explore skills, understand their importance, and find the best resources to learn them
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Skills You Have',    value: mySkillNames.size,         color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Skills to Learn',    value: missingSkillNames.length,  color: '#dc2626', bg: '#fef2f2' },
            { label: 'Total Skills Listed',value: ALL_SKILLS.length,         color: '#2563eb', bg: '#eff6ff' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '16px 18px', background: s.bg, border: `1px solid ${s.color}20` }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'Sora,sans-serif' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: s.color, fontWeight: 500, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid var(--border)', paddingBottom: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                padding: '10px 18px', border: 'none', cursor: 'pointer',
                background: 'none', fontSize: 13, fontWeight: 600,
                color: activeTab === t.id ? 'var(--brand)' : 'var(--text-3)',
                borderBottom: activeTab === t.id ? '2px solid var(--brand)' : '2px solid transparent',
                marginBottom: -2, transition: 'all 0.15s',
                fontFamily: 'Sora, sans-serif',
              }}
            >
              {t.label}
              <span style={{
                marginLeft: 6, fontSize: 10, fontWeight: 700,
                background: activeTab === t.id ? 'var(--brand)' : '#e2e8f0',
                color: activeTab === t.id ? '#fff' : 'var(--text-3)',
                padding: '2px 7px', borderRadius: 20
              }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* ── ALL SKILLS TAB ── */}
        {activeTab === 'all' && (
          <div>
            {/* Search + Filter */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
              <input
                placeholder="Search skills..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, minWidth: 180, padding: '9px 14px', borderRadius: 8,
                  border: '1.5px solid var(--border)', fontSize: 13, fontFamily: 'Sora, sans-serif',
                  outline: 'none', color: 'var(--text-1)',
                }}
              />
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                style={{
                  padding: '9px 14px', borderRadius: 8, border: '1.5px solid var(--border)',
                  fontSize: 13, fontFamily: 'Sora, sans-serif', color: 'var(--text-1)',
                  background: '#fff', cursor: 'pointer',
                }}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Importance legend */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              {Object.entries(IMPORTANCE_CONFIG).map(([level, cfg]) => (
                <span key={level} style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                  color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`
                }}>● {level}</span>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {filteredAll.map(sk => (
                <SkillCard
                  key={sk.name}
                  skill={sk}
                  onClick={setPopup}
                  companyCount={sk.companyCount}
                  badge={
                    mySkillNames.has(sk.name.toLowerCase())
                      ? { label: '✓ You have this', style: { color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0' } }
                      : missingSkillNames.includes(sk.name.toLowerCase())
                      ? { label: '! Gap', style: { color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' } }
                      : null
                  }
                />
              ))}
            </div>
            {filteredAll.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)', fontSize: 14 }}>
                No skills match your search.
              </div>
            )}
          </div>
        )}

        {/* ── YOUR SKILLS TAB ── */}
        {activeTab === 'yours' && (
          <div>
            {yourSkills.length === 0 && unknownMySkills.length === 0 ? (
              <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>No skills in your profile yet</div>
                <a href="/profile/edit" style={{ color: 'var(--brand)', fontWeight: 500, fontSize: 13 }}>→ Add skills in Profile Edit</a>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
                  Click any skill card to see what it is, where it's used, and how to improve further.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
                  {yourSkills.map(sk => (
                    <SkillCard
                      key={sk.name}
                      skill={sk}
                      onClick={setPopup}
                      companyCount={sk.companyCount}
                      badge={{ label: '✓ Your Skill', style: { color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0' } }}
                    />
                  ))}
                </div>

                {/* Skills not in master list */}
                {unknownMySkills.length > 0 && (
                  <div className="card" style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 10 }}>
                      Other Skills in Your Profile
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {unknownMySkills.map(s => (
                        <span key={s} className="badge badge-success" style={{ fontSize: 12, padding: '5px 12px' }}>✓ {s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── RECOMMENDED SKILLS TAB ── */}
        {activeTab === 'recommended' && (
          <div>
            {missingSkillNames.length === 0 ? (
              <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
                  {companies.length === 0
                    ? 'No company analysis yet — submit your profile to get skill gap analysis'
                    : 'No skill gaps! You meet all company requirements.'}
                </div>
                {companies.length === 0 && (
                  <a href="/profile/edit" style={{ color: 'var(--brand)', fontWeight: 500, fontSize: 13 }}>→ Complete your profile</a>
                )}
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
                  Skills sorted by how many companies require them — focus on the top ones first.
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
                  Click any card for a detailed learning roadmap and course links.
                </div>

                {/* Priority bar */}
                <div className="card" style={{ padding: '14px 18px', marginBottom: 18, background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>🎯 SKILL PRIORITY RANKING</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {recommendedSkills.slice(0, 5).map((sk, i) => (
                      <div key={sk.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', width: 20 }}>#{i + 1}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1 }}>{sk.name}</span>
                        <span style={{ fontSize: 11, color: '#dc2626' }}>
                          {sk.companyCount} {sk.companyCount === 1 ? 'company' : 'companies'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
                  {recommendedSkills.map(sk => (
                    <SkillCard
                      key={sk.name}
                      skill={sk}
                      onClick={setPopup}
                      companyCount={sk.companyCount}
                      badge={{ label: '! Learn this', style: { color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' } }}
                    />
                  ))}
                </div>

                {/* Unknown gap skills */}
                {unknownGapSkills.length > 0 && (
                  <div className="card" style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 10 }}>
                      Other Missing Skills (from company analysis)
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {unknownGapSkills.map(s => (
                        <span key={s} style={{
                          fontSize: 12, padding: '5px 12px', borderRadius: 20,
                          color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', fontWeight: 500
                        }}>✗ {s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Skill popup */}
        {popup && (
          <SkillPopup
            skill={popup}
            companyCount={popup.companyCount || 0}
            onClose={() => setPopup(null)}
          />
        )}

      </main>
    </div>
  )
}