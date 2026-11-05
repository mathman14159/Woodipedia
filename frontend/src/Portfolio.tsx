import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Download, ExternalLink } from 'lucide-react'
import { Article, articleUrl, projects } from './content'
import site from './site.json'

export const mainLinks = [ ['/', 'Home'], ['/projects', 'Projects'], ['/experience', 'Experience'], ['/about', 'About'], ['/resume', 'Resume'], ['/contact', 'Contact'] ] as const

export const pageHeadings: Record<string, { id: string; title: string; level: number }[]> = {
  '/': ['Selected projects', 'Experience', 'Technical skills', 'Beyond the code'].map((title) => ({ id: title.toLowerCase().replaceAll(' ', '-'), title, level: 2 })),
  '/projects': [{ id: 'featured-work', title: 'Featured work', level: 2 }, { id: 'further-work', title: 'Further work & demonstrations', level: 2 }],
  '/resume': [{ id: 'resume-document', title: 'Resume document', level: 2 }, { id: 'at-a-glance', title: 'At a glance', level: 2 }],
  '/contact': [{ id: 'get-in-touch', title: 'Get in touch', level: 2 }],
}

export function PortfolioPage({ title, label, children }: { title: string; label: string; children: ReactNode }) {
  return <main className="article-main portfolio-main" id="article-top" tabIndex={-1}>
    <div className="article-pretitle">From Woodpedia, the portfolio of Quentin Wood</div>
    <h1>{title}</h1>
    <div className="article-tabs"><div className="tab-group"><span className="selected">{label}</span></div><div className="tab-group"><Link to="/about">Behind the work</Link></div></div>
    <div className="article-content portfolio-content">{children}</div>
  </main>
}

export function ProfileLink({ kind, children, className }: { kind: 'github' | 'linkedin' | 'email'; children: ReactNode; className?: string }) {
  const value = site[kind] as string | null
  return value ? <a className={className} href={kind === 'email' ? `mailto:${value}` : value} {...(kind !== 'email' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}<ExternalLink size={12} aria-hidden="true" /></a>
    : <Link className={className} to={`/contact#${kind}`}>{children}</Link>
}

export function ProjectPreview({ article, compact = false }: { article: Article; compact?: boolean }) {
  const project = article.project!
  return <article className={`project-preview ${compact ? 'compact' : ''}`}>
    <div className="project-kicker">{project.area}</div>
    <h3><Link to={articleUrl(article.title)}>{project.name}</Link></h3>
    <p>{article.description}</p>
    <dl className="project-facts">
      <div><dt>Built with</dt><dd>{project.technologies.length ? project.technologies.join(' · ') : 'Technology details to be added'}</dd></div>
      <div><dt>My work</dt><dd>{project.contribution}</dd></div>
      {project.outcome && <div><dt>Outcome</dt><dd>{project.outcome}</dd></div>}
    </dl>
    {!compact && article.image && <img className="project-image" src={article.image} alt={article.imageCaption || project.name} width={article.imageWidth} height={article.imageHeight} loading="lazy" decoding="async" />}
    <div className="project-links"><Link to={articleUrl(article.title)} aria-label={`Read ${project.name} case study`}>Read case study <ArrowRight size={13} aria-hidden="true" /></Link>
      {project.repository && <a href={project.repository} target="_blank" rel="noopener noreferrer">Repository <ExternalLink size={12} aria-hidden="true" /></a>}
      {project.demo && <a href={project.demo} target="_blank" rel="noopener noreferrer">Live demo <ExternalLink size={12} aria-hidden="true" /></a>}
    </div>
  </article>
}

function Skills() {
  return <dl className="skills-list">
    <div><dt>Languages</dt><dd>Python, C#, JavaScript, TypeScript <span>— <Link to="/projects/graduation-day">games</Link> and web applications</span></dd></div>
    <div><dt>Frontend</dt><dd>React, Astro, HTML, CSS, Vite <span>— <Link to="/projects/olathe-tuxedo-corn">commerce</Link>, <Link to="/projects/wildlife-survey">wildlife surveys</Link> & this site</span></dd></div>
    <div><dt>Backend & data</dt><dd>Supabase and automation <span>— <Link to="/projects/touch-of-care">operational workflows</Link></span></dd></div>
    <div><dt>Tools & platforms</dt><dd>Git, Unity, VR development <span>— <Link to="/projects/graduation-day">Graduation Day</Link></span></dd></div>
  </dl>
}

export function HomePage() {
  return <PortfolioPage title={site.name} label="Portfolio">
    <section className="home-intro" aria-label="Introduction">
      <p className="professional-headline">{site.headline}</p>
      <p className="education-line">{site.school} <span aria-hidden="true">·</span> Expected graduation {site.graduation}</p>
      <p className="intro-copy">I build software for real problems, from commercial websites to community mapping tools. I’m interested in full-stack development, AI, automation, and healthcare technology.</p>
      <div className="portfolio-actions"><Link className="primary-button" to="/projects">View Projects <ArrowRight size={15} aria-hidden="true" /></Link><Link className="secondary-button" to="/resume">View Resume</Link><ProfileLink kind="github">GitHub</ProfileLink><Link to="/contact">Contact Me</Link></div>
    </section>
    <section aria-labelledby="selected-projects"><div className="section-heading"><h2 id="selected-projects">Selected projects</h2><Link to="/projects">All projects <ArrowRight size={13} aria-hidden="true" /></Link></div>
      <div className="project-grid">{projects.filter((article) => article.project?.featured).map((article) => <ProjectPreview key={article.slug} article={article} compact />)}</div>
    </section>
    <section aria-labelledby="experience"><h2 id="experience">Experience</h2><div className="experience-summary"><div><h3>Junior Software Developer</h3><p className="entry-meta">Touch of Care · Montrose, Colorado · Part-time</p></div><p>My work at Touch of Care connects software development and operational automation with an interest in healthcare technology.</p><Link to="/experience">Experience & engineering involvement <ArrowRight size={13} aria-hidden="true" /></Link></div></section>
    <section aria-labelledby="technical-skills"><h2 id="technical-skills">Technical skills</h2><Skills /></section>
    <section aria-labelledby="beyond-the-code"><h2 id="beyond-the-code">Beyond the code</h2><p>I grew up in rural Colorado, balancing school, distance running, part-time work, and programming. Those experiences shape the problems I want to work on and the way I approach learning.</p><p><Link to="/about">More about me</Link> · <Link to="/contact">Let’s connect</Link></p></section>
  </PortfolioPage>
}

export function ProjectsPage() {
  return <PortfolioPage title="Projects" label="Project index"><p className="page-lead">Software for commerce, communities, and interactive experiences. Each case study distinguishes the work I can describe from the details still to be documented.</p>
    <h2 id="featured-work">Featured work</h2><div className="project-list">{projects.filter((article) => article.project?.featured).map((article) => <ProjectPreview key={article.slug} article={article} />)}</div>
    <h2 id="further-work">Further work & demonstrations</h2><div className="project-list">{projects.filter((article) => !article.project?.featured).map((article) => <ProjectPreview key={article.slug} article={article} />)}</div>
    <p className="archive-link">Earlier competition work: <Link to="/wiki/Cluck_Run">Cluck Run</Link> · <Link to="/wiki/Collector_of_Souls">Collector of Souls</Link>. Browse the <Link to="/wiki/Software_projects_of_Quentin_Wood">original project article</Link>.</p>
  </PortfolioPage>
}

export function ResumePage() {
  const resume = site.resume as string | null
  return <PortfolioPage title="Resume" label="Career overview"><h2 id="resume-document">Resume document</h2>
    {resume ? <><p>Open the PDF in your browser or download a copy.</p><div className="portfolio-actions"><a className="primary-button" href={resume} target="_blank" rel="noopener noreferrer">View resume PDF <ExternalLink size={14} aria-hidden="true" /></a><a className="secondary-button" href={resume} download>Download PDF <Download size={14} aria-hidden="true" /></a></div></>
      : <div className="content-notice"><strong>Resume PDF coming soon</strong><p>A downloadable resume has not been provided yet. This page is a summary of my background; the PDF will be linked here when available.</p></div>}
    <h2 id="at-a-glance">At a glance</h2><dl className="skills-list"><div><dt>Education</dt><dd>Computer Science, {site.school}<br />Expected graduation: {site.graduation}</dd></div><div><dt>Experience</dt><dd>Junior Software Developer, Touch of Care · Part-time<br /><Link to="/experience">View experience</Link></dd></div><div><dt>Recognition</dt><dd>First place, 2026 FBLA National Computer Game and Simulation Development — <Link to="/projects/graduation-day">Graduation Day</Link></dd></div></dl>
    <h3>Selected technical work</h3><ul>{projects.filter((article) => article.project?.featured).map((article) => <li key={article.slug}><Link to={articleUrl(article.title)}>{article.project!.name}</Link> — {article.project!.technologies.join(', ') || article.project!.area}</li>)}</ul><p><Link to="/projects">Explore all projects</Link> · <Link to="/contact">Contact information</Link></p>
  </PortfolioPage>
}

export function ContactPage() {
  return <PortfolioPage title="Contact" label="Get in touch"><h2 id="get-in-touch">Get in touch</h2><p className="page-lead">I’m interested in software engineering internships, research, and projects that put useful software into people’s hands.</p><p>My interests include full-stack development, AI, automation, and healthcare technology.</p><dl className="contact-list">{(['email', 'github', 'linkedin'] as const).map((kind) => <div id={kind} key={kind}><dt>{kind === 'email' ? 'Email' : kind === 'github' ? 'GitHub' : 'LinkedIn'}</dt><dd>{site[kind] ? <ProfileLink kind={kind}>{kind === 'email' ? site[kind] : `View ${kind === 'github' ? 'GitHub' : 'LinkedIn'} profile`}</ProfileLink> : <><span className="unavailable">{kind === 'email' ? 'Public email' : 'Profile link'} not provided yet</span><small>To be added by Quentin.</small></>}</dd></div>)}</dl><p>In the meantime, explore my <Link to="/projects">projects</Link>, <Link to="/experience">experience</Link>, or <Link to="/about">background</Link>.</p></PortfolioPage>
}
